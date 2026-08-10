import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { LegalLayout } from "@/routes/privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termini di servizio — PagoPilot" },
      { name: "description", content: "Le condizioni d'uso di PagoPilot." },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "10 agosto 2026";
const LAST_UPDATED_EN = "August 10, 2026";
const CONTACT_EMAIL = "hello@pagopilot.app";

function TermsPage() {
  const { lang } = useI18n();
  return <LegalLayout>{lang === "en" ? <TermsEn /> : <TermsIt />}</LegalLayout>;
}

function TermsIt() {
  return (
    <>
      <h1 className="large-title">Termini di servizio</h1>
      <p className="text-sm text-muted-foreground">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <p>
        Utilizzando PagoPilot accetti questi termini. Se non li accetti, ti chiediamo di non
        utilizzare l&apos;app.
      </p>

      <h2>Cos&apos;è PagoPilot</h2>
      <p>
        PagoPilot è uno strumento organizzativo che ti aiuta a tenere traccia di bollette, avvisi
        PagoPA, tasse e altre scadenze di pagamento.{" "}
        <strong>
          PagoPilot non è un istituto di pagamento e non effettua pagamenti per tuo conto.
        </strong>{" "}
        Ogni pagamento va sempre effettuato tramite la tua banca, l&apos;app IO o gli altri canali
        ufficiali pagoPA.
      </p>

      <h2>Il tuo account</h2>
      <p>
        Sei responsabile della correttezza delle informazioni fornite e della sicurezza delle tue
        credenziali d&apos;accesso. Devi avere almeno 16 anni per usare PagoPilot.
      </p>

      <h2>Uso accettabile</h2>
      <p>
        Ti impegni a non utilizzare PagoPilot per scopi illeciti, a non tentare di accedere ad
        account altrui e a non abusare delle funzionalità di importazione ed estrazione automatica
        dei documenti (ad esempio caricando file estranei allo scopo dell&apos;app).
      </p>

      <h2>Accuratezza dei dati estratti</h2>
      <p>
        I dati estratti automaticamente dai documenti tramite intelligenza artificiale possono
        contenere errori. Ti invitiamo a verificare sempre importi, scadenze e codici prima di
        effettuare un pagamento. PagoPilot non è responsabile per pagamenti errati o mancati basati
        su dati estratti in modo impreciso.
      </p>

      <h2>Piano gratuito e Premium</h2>
      <p>
        PagoPilot offre un piano gratuito con un numero limitato di importazioni mensili e un piano
        Premium a pagamento con funzionalità aggiuntive. Gli abbonamenti Premium sono gestiti
        tramite Google Play o l&apos;App Store di Apple, si rinnovano automaticamente salvo
        disdetta, e possono essere annullati in qualsiasi momento dalle impostazioni del tuo account
        Google o Apple. Non gestiamo direttamente pagamenti o dati della tua carta.
      </p>

      <h2>Proprietà intellettuale</h2>
      <p>
        Il nome PagoPilot, il logo e i contenuti dell&apos;app sono di proprietà dello sviluppatore.
        I tuoi dati e i documenti che carichi restano di tua proprietà.
      </p>

      <h2>Limitazione di responsabilità</h2>
      <p>
        PagoPilot viene fornito &quot;così com&apos;è&quot;, senza garanzie di alcun tipo. Nella
        misura massima consentita dalla legge, non siamo responsabili per danni indiretti derivanti
        dall&apos;uso dell&apos;app, incluse scadenze non rispettate o pagamenti mancati.
      </p>

      <h2>Sospensione e chiusura dell&apos;account</h2>
      <p>
        Puoi chiudere il tuo account in qualsiasi momento richiedendone la cancellazione. Ci
        riserviamo il diritto di sospendere account che violano questi termini.
      </p>

      <h2>Modifiche ai termini</h2>
      <p>
        Potremmo aggiornare questi termini periodicamente. Le modifiche rilevanti saranno comunicate
        tramite l&apos;app o via email.
      </p>

      <h2>Legge applicabile</h2>
      <p>Questi termini sono regolati dalla legge italiana.</p>

      <h2>Contatti</h2>
      <p>
        Per domande su questi termini, scrivi a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <h1 className="large-title">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED_EN}</p>

      <p>
        By using PagoPilot you agree to these terms. If you don&apos;t agree, please don&apos;t use
        the app.
      </p>

      <h2>What PagoPilot is</h2>
      <p>
        PagoPilot is an organizational tool that helps you track bills, PagoPA notices, taxes and
        other payment due dates.{" "}
        <strong>
          PagoPilot is not a payment institution and does not make payments on your behalf.
        </strong>{" "}
        Every payment must always be made through your bank, the official IO app, or other official
        pagoPA channels.
      </p>

      <h2>Your account</h2>
      <p>
        You&apos;re responsible for the accuracy of the information you provide and for keeping your
        login credentials secure. You must be at least 16 years old to use PagoPilot.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to use PagoPilot for unlawful purposes, not to attempt to access other
        users&apos; accounts, and not to abuse the document import and extraction features (for
        example, by uploading files unrelated to the app&apos;s purpose).
      </p>

      <h2>Accuracy of extracted data</h2>
      <p>
        Data extracted automatically from documents via AI may contain errors. Always verify
        amounts, due dates and codes before making a payment. PagoPilot is not responsible for
        incorrect or missed payments based on inaccurately extracted data.
      </p>

      <h2>Free plan and Premium</h2>
      <p>
        PagoPilot offers a free plan with a limited number of monthly imports and a paid Premium
        plan with additional features. Premium subscriptions are managed through Google Play or the
        Apple App Store, renew automatically unless cancelled, and can be cancelled at any time from
        your Google or Apple account settings. We don&apos;t directly handle payments or your card
        details.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The PagoPilot name, logo and app content belong to the developer. Your data and any
        documents you upload remain your property.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        PagoPilot is provided &quot;as is,&quot; without warranties of any kind. To the maximum
        extent permitted by law, we are not liable for indirect damages arising from use of the app,
        including missed due dates or missed payments.
      </p>

      <h2>Suspension and account closure</h2>
      <p>
        You can close your account at any time by requesting deletion. We reserve the right to
        suspend accounts that violate these terms.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Material changes will be communicated through
        the app or by email.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by Italian law.</p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}
