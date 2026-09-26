// Mailpad Fase 1 (A4): echte interface, stub-achterkant.
// Stuurt NOOIT echt mail en claimt nooit "verzonden" richting de gebruiker:
// requestReset() geeft altijd dezelfde neutrale respons, ongeacht of het
// adres bestaat (geen user-enumeratie).
export interface ResetMail {
  to: string;
  subject: string;
  body: string;
}

export interface Mailer {
  readonly backend: "stub";
  sendReset(mail: ResetMail): Promise<void>;
  outbox(): ResetMail[];
}

export class StubMailer implements Mailer {
  readonly backend = "stub" as const;
  private box: ResetMail[] = [];
  async sendReset(mail: ResetMail): Promise<void> {
    // Alleen in-memory outbox voor lokale tests; geen SMTP, geen log met PII.
    this.box.push(mail);
  }
  outbox(): ResetMail[] {
    return [...this.box];
  }
}

let shared: Mailer | null = null;

export function getMailer(): Mailer {
  if (!shared) shared = new StubMailer();
  return shared;
}

// Echte implementatie later: bouw SMTP-mailer met dezelfde interface en
// vervang getMailer(). Niets anders in de codebase hoeft te veranderen.
