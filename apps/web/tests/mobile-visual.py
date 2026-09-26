"""Rendered mobile regression check. Needs a built web/dist, Chromium and websockets.

python3 apps/web/tests/mobile-visual.py --dist apps/web/dist --out qa-output/after
Use --baseline to record unpatched geometry/screenshots without failing the assertions.
All server responses in this script are explicitly labelled local visual-test fixtures.
"""
import argparse
import base64
import json
import subprocess
import tempfile
import time
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import quote
from websockets.sync.client import connect

MEALS = [{"id": "ontbijt", "label": "Ontbijt", "sort": 0}, {"id": "lunch", "label": "Lunch", "sort": 1}]
ME = {"id": "visual-test-only", "email": "fixture@example.invalid", "onboarded": True,
      "meals": MEALS, "goals": {"kcal": 2200, "protein": None, "carbs": None, "fat": None,
                              "waterMl": None, "weightKg": None}}
DIARY = {"date": "2026-09-26", "meals": MEALS, "entries": [],
         "totals": {"kcal": 0, "protein": 0, "carbs": 0, "fat": 0},
         "planned": {"kcal": 0, "protein": 0, "carbs": 0, "fat": 0},
         "waterMl": 0, "note": "", "weightKg": None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dist", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--baseline", action="store_true")
    args = parser.parse_args()
    dist = args.dist.resolve()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    if not (dist / "index.html").is_file():
        raise RuntimeError("Build the web app before running visual QA")

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *handler_args, **kwargs):
            super().__init__(*handler_args, directory=str(dist), **kwargs)

        def do_GET(self):
            if self.path.startswith("/api/"):
                if self.path.startswith("/api/auth/me"):
                    data = ME
                elif self.path.startswith("/api/diary"):
                    data = DIARY
                elif self.path.startswith("/api/auth/sessions"):
                    data = {"sessions": []}
                elif self.path.startswith("/api/insights/trend"):
                    data = {"from": DIARY["date"], "to": DIARY["date"], "points": [],
                            "conclusionOk": False, "conclusion": "Geen demo-invoer", "kcalGoal": 2200}
                elif self.path.startswith("/api/water"):
                    data = {"totalMl": 0, "entries": []}
                elif self.path.startswith("/api/weight"):
                    data = {"entries": []}
                else:
                    data = {}
                payload = json.dumps(data).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            elif self.path.startswith("/meer") or self.path == "/":
                self.path = "/index.html"
                super().do_GET()
            else:
                super().do_GET()

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"
    # Separate browser profile, no real account/session data; random local CDP port.
    with tempfile.TemporaryDirectory(prefix="bitewise-visual-") as profile:
        chrome = subprocess.Popen([
            str(Path.home() / ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome"),
            "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
            "--no-first-run", "--remote-allow-origins=*", "--remote-debugging-port=0",
            f"--user-data-dir={profile}", "about:blank",
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            active = Path(profile) / "DevToolsActivePort"
            for _ in range(100):
                if active.is_file():
                    break
                if chrome.poll() is not None:
                    raise RuntimeError("Chromium exited before CDP became available")
                time.sleep(.05)
            port = active.read_text().splitlines()[0]
            req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?{quote(url, safe=':/')}", method="PUT")
            tab = json.load(urllib.request.urlopen(req))
            with connect(tab["webSocketDebuggerUrl"], origin="http://localhost") as ws:
                ident = 0

                def cmd(method, params=None):
                    nonlocal ident
                    ident += 1
                    ws.send(json.dumps({"id": ident, "method": method, "params": params or {}}))
                    while True:
                        response = json.loads(ws.recv(timeout=30))
                        if response.get("id") == ident:
                            if "error" in response:
                                raise RuntimeError(response["error"])
                            return response.get("result", {})

                def js(expr):
                    result = cmd("Runtime.evaluate", {"expression": expr, "returnByValue": True,
                                                      "awaitPromise": True})
                    if "exceptionDetails" in result:
                        raise RuntimeError(result["exceptionDetails"])
                    return result.get("result", {}).get("value")

                def screenshot(label):
                    data = cmd("Page.captureScreenshot", {"format": "png"})["data"]
                    (out / f"{label}.png").write_bytes(base64.b64decode(data))

                def click_tab(name):
                    rect = js("""(() => {let a=[...document.querySelectorAll('.dock a')]
                        .find(x=>x.textContent.trim()===%s);if(!a)throw Error('tab missing');
                        let r=a.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()""" % json.dumps(name))
                    for typ in ("mousePressed", "mouseReleased"):
                        cmd("Input.dispatchMouseEvent", {"type": typ, "x": rect["x"], "y": rect["y"],
                                                         "button": "left", "clickCount": 1})
                    time.sleep(.08)

                def measure():
                    return js("""(() => {
                        const root=document.documentElement, nav=document.querySelector('.dock');
                        if(!nav) throw Error('dock absent: '+location.href+' '+document.body.innerText.slice(0,150));
                        const color=x=>x?getComputedStyle(x).backgroundColor:'missing';
                        return {width:innerWidth, height:innerHeight, body:color(document.body),
                            card:color(document.querySelector('.card')), dock:color(nav),
                            text:getComputedStyle(document.body).color,
                            scheme:getComputedStyle(root).colorScheme, theme:root.dataset.thema,
                            tabs:[...nav.querySelectorAll('a')].map(a=>{let r=a.getBoundingClientRect();
                                let p=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                                return {label:a.textContent.trim(), x:r.x, right:r.right, top:r.top,
                                    bottom:r.bottom, width:r.width,height:r.height,
                                    clickable:a===p||a.contains(p)};})};
                    })()""")

                cmd("Page.enable")
                cmd("Runtime.enable")
                results = []
                for width in (360, 390, 402, 430):
                    for system in ("light", "dark"):
                        for height in (844, 450):
                            cmd("Emulation.setDeviceMetricsOverride", {"width": width, "height": height,
                                "deviceScaleFactor": 1, "mobile": True})
                            cmd("Emulation.setEmulatedMedia", {"features": [
                                {"name": "prefers-color-scheme", "value": system}]})
                            cmd("Page.navigate", {"url": url})
                            for _ in range(100):
                                if js("document.querySelectorAll('.dock a').length") == 5:
                                    break
                                time.sleep(.05)
                            else:
                                raise RuntimeError("fixture app did not render all five tabs")
                            if width == 390 and height == 844:
                                screenshot(f"390-{system}-diary")
                            # Click each real tab center and verify hit-test. Go to Meer last for theme buttons.
                            for name in ("Eten", "Inzicht", "Gezond", "Dagboek", "Meer"):
                                click_tab(name)
                                m = measure()
                                m.update({"requestedWidth": width, "system": system, "state": name,
                                          "keyboardHeight": height})
                                results.append(m)
                            if width == 390 and height == 844:
                                screenshot(f"390-{system}-more")
                                # The real theme controls must change CSS tokens, not only color-scheme.
                                for label in ("Licht", "Donker", "Auto"):
                                    js("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===%s).click()" % json.dumps(label))
                                    time.sleep(.05)
                                    state = measure()
                                    state.update({"requestedWidth": width, "system": system,
                                                  "state": "theme-" + label, "keyboardHeight": height})
                                    results.append(state)
                                    screenshot(f"390-{system}-theme-{label.lower()}")
                                if system == "light":
                                    js("document.querySelector('.dock .tab').focus()")
                                    cmd("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Tab", "code": "Tab", "windowsVirtualKeyCode": 9})
                                    cmd("Input.dispatchKeyEvent", {"type": "keyUp", "key": "Tab", "code": "Tab", "windowsVirtualKeyCode": 9})
                                    ring = js("""(() => {const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e);
                                        return {label:e.textContent.trim(), left:r.left, right:r.right,
                                            outline:s.outlineWidth, offset:s.outlineOffset, color:s.outlineColor}})()""")
                                    results.append({"state": "focus", "system": system, "requestedWidth": width, "ring": ring})
                                    screenshot("390-light-focus")
                            # Browser text simulation, not a native Dynamic Type emulator.
                            js("""(() => {let s=document.createElement('style');
                                s.textContent='body {font-size:32px !important} .tab {font-size:32px !important}';
                                document.head.append(s)})()""")
                            large = measure()
                            large.update({"requestedWidth": width, "system": system,
                                          "state": "large-text", "keyboardHeight": height})
                            results.append(large)
                            if width == 390 and height == 844:
                                screenshot(f"390-{system}-large-text")
                                if system == "light":
                                    cmd("Emulation.setSafeAreaInsetsOverride", {"insets": {"bottom": 34}})
                                    safe = js("""(() => ({bottom:getComputedStyle(document.querySelector('.dock')).bottom,
                                        padding:getComputedStyle(document.body).paddingBottom}))()""")
                                    results.append({"state": "safe-area-34", "system": system, "requestedWidth": width, "safe": safe})
                                    screenshot("390-light-safe-area-34")
                                    cmd("Emulation.setSafeAreaInsetsOverride", {"insets": {"bottom": 0}})
                (out / "results.json").write_text(json.dumps(results, indent=2))
                failures = []
                for r in results:
                    if r["state"] == "safe-area-34":
                        if r["safe"]["bottom"] != "46px" or float(r["safe"]["padding"].replace("px", "")) < 180:
                            failures.append(f"safe area padding failed: {r['safe']}")
                        continue
                    if r["state"] == "focus":
                        ring = r["ring"]
                        if ring["label"] != "Eten" or ring["outline"] != "3px" or ring["left"] < 5 or ring["right"] > 385:
                            failures.append(f"focus ring not visible inside viewport: {ring}")
                        continue
                    if r["width"] != r["requestedWidth"]:
                        failures.append(f"{r['state']}: unexpected layout viewport {r['width']}")
                    for tab in r["tabs"]:
                        if tab["x"] < 5 or tab["right"] > r["width"] - 5 or tab["width"] < 44 or tab["height"] < 44 or not tab["clickable"]:
                            failures.append(f"{r['requestedWidth']}/{r['system']}/{r['state']}: {tab}")
                for system in ("light", "dark"):
                    sample = {r["state"]: r for r in results if r["requestedWidth"] == 390 and
                              r.get("keyboardHeight") == 844 and r["system"] == system and r["state"].startswith("theme-")}
                    light, dark, auto = (sample["theme-" + label] for label in ("Licht", "Donker", "Auto"))
                    if light["body"] != "rgb(244, 247, 243)" or dark["body"] != "rgb(12, 21, 17)":
                        failures.append(f"{system}: manual theme failed {light['body']} {dark['body']}")
                    if auto["body"] != (light if system == "light" else dark)["body"]:
                        failures.append(f"{system}: auto failed {auto['body']}")
                    if light["card"] == dark["card"] or light["dock"] == dark["dock"] or light["text"] == dark["text"]:
                        failures.append(f"{system}: card/dock/text did not switch")
                print(json.dumps({"observations": len(results), "failures": failures[:15], "totalFailures": len(failures)}))
                if failures and not args.baseline:
                    raise AssertionError("Mobile visual regression: see results.json")
        finally:
            chrome.terminate()
            chrome.wait(timeout=5)
            server.shutdown()

if __name__ == "__main__":
    main()
