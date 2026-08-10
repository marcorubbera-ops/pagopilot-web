import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/AppShell";

export const Route = createFileRoute("/privacy")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Informativa sulla privacy — PagoPilot" },
      { name: "description", content: "Come PagoPilot raccoglie, usa e protegge i tuoi dati." },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "10 agosto 2026";
const LAST_UPDATED_EN = "August 10, 2026";
const CONTACT_EMAIL = "hello@pagopilot.app";

function PrivacyPage() {
  const { lang } = useI18n();
  return <LegalLayout>{lang === "en" ? <PrivacyEn /> : <PrivacyIt />}</LegalLayout>;
}

export function LegalLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            <ChevronLeft className="size-4" aria-hidden />
            {t("app.name")}
          </Link>
          <LanguageSwitcher />
        </div>
        <article className="ios-card space-y-5 p-6 text-[15px] leading-relaxed text-foreground [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:first:mt-0 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </main>
  );
}

function PrivacyIt() {
  return (
    <>
      <h1 className="large-title">Informativa sulla privacy</h1>
      <p className="text-sm text-muted-foreground">Ultimo aggiornamento: {LAST_UPDATED}</p>

      <p>
        Questa informativa spiega quali dati raccoglie PagoPilot, come li usa e quali diritti hai.
        PagoPilot è un&apos;app che ti aiuta a organizzare bollette, avvisi PagoPA, tasse e altre
        scadenze di pagamento.
      </p>

      <h2>Titolare del trattamento</h2>
      <p>
        Il titolare del trattamento dei dati è lo sviluppatore di PagoPilot, contattabile
        all&apos;indirizzo{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2>Dati che raccogliamo</h2>
      <ul>
        <li>
          <strong>Dati account:</strong> indirizzo email e password (o, se scegli l&apos;accesso con
          Google, il tuo nome, email e immagine del profilo forniti da Google).
        </li>
        <li>
          <strong>Dati sui pagamenti:</strong> titolo, ente, importo, scadenza, categoria, numero
          avviso, codice fiscale dell&apos;ente, IBAN e note che inserisci manualmente o che vengono
          estratti da un documento importato.
        </li>
        <li>
          <strong>Documenti caricati:</strong> foto o PDF di bollette, avvisi PagoPA, F24 o ricevute
          che importi, conservati nel tuo archivio privato.
        </li>
        <li>
          <strong>Dati di utilizzo:</strong> informazioni tecniche minime necessarie al
          funzionamento dell&apos;app, come il numero di importazioni effettuate nel mese (per
          applicare i limiti del piano gratuito).
        </li>
      </ul>

      <h2>Come usiamo i tuoi dati</h2>
      <ul>
        <li>Per creare e gestire il tuo account e farti accedere ai tuoi pagamenti.</li>
        <li>
          Per estrarre automaticamente i dati da un documento che importi: il file viene inviato
          all&apos;API Gemini di Google esclusivamente per la lettura del testo, e non viene
          utilizzato da Google per addestrare i propri modelli.
        </li>
        <li>
          Per inviarti promemoria e notifiche sulle scadenze, mostrate all&apos;interno
          dell&apos;app o come notifiche sul tuo dispositivo (generate localmente, senza passare da
          un server).
        </li>
        <li>
          Per inviarti email di servizio: conferma dell&apos;account, reimpostazione della password.
        </li>
        <li>Per gestire l&apos;eventuale abbonamento Premium (vedi sotto).</li>
      </ul>

      <h2>Con chi condividiamo i dati</h2>
      <p>
        Non vendiamo i tuoi dati a nessuno. Li condividiamo solo con i fornitori tecnici necessari a
        far funzionare l&apos;app:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, autenticazione e archiviazione dei documenti.
        </li>
        <li>
          <strong>Google (Gemini API)</strong> — lettura automatica dei documenti importati.
        </li>
        <li>
          <strong>Google Sign-In</strong> — solo se scegli di accedere con il tuo account Google.
        </li>
        <li>
          <strong>Resend</strong> — invio delle email di servizio (conferma account, reset
          password).
        </li>
        <li>
          <strong>RevenueCat, Google Play e Apple App Store</strong> — gestione
          dell&apos;abbonamento Premium. Il pagamento viene elaborato interamente da Google o Apple:
          PagoPilot non vede né conserva i dati della tua carta.
        </li>
      </ul>

      <h2>Conservazione dei dati</h2>
      <p>
        Conserviamo i tuoi dati finché il tuo account resta attivo. Puoi eliminare singoli pagamenti
        in qualsiasi momento dall&apos;app. Per richiedere la cancellazione completa del tuo account
        e di tutti i dati associati, scrivi a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2>I tuoi diritti</h2>
      <p>
        Se ti trovi nell&apos;Unione Europea, hai diritto ad accedere, correggere, esportare o
        cancellare i tuoi dati (diritti previsti dal GDPR). Puoi esportare i tuoi pagamenti in
        formato CSV in qualsiasi momento dalla sezione Statistiche o Impostazioni dell&apos;app. Per
        qualsiasi altra richiesta, scrivici all&apos;indirizzo sopra indicato.
      </p>

      <h2>Sicurezza</h2>
      <p>
        I dati sono trasmessi in modo cifrato (HTTPS) e ogni utente può accedere solo ai propri
        pagamenti e documenti, grazie alle policy di sicurezza a livello di database (Row Level
        Security) configurate su Supabase.
      </p>

      <h2>Minori</h2>
      <p>
        PagoPilot non è destinato a persone di età inferiore ai 16 anni, e non raccogliamo
        consapevolmente dati di minori.
      </p>

      <h2>Modifiche a questa informativa</h2>
      <p>
        Potremmo aggiornare periodicamente questa informativa. Le modifiche rilevanti saranno
        comunicate tramite l&apos;app o via email.
      </p>

      <h2>Contatti</h2>
      <p>
        Per qualsiasi domanda su questa informativa o sui tuoi dati, scrivi a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <h1 className="large-title">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED_EN}</p>

      <p>
        This policy explains what data PagoPilot collects, how we use it, and what rights you have.
        PagoPilot is an app that helps you organize bills, PagoPA notices, taxes, and other payment
        due dates.
      </p>

      <h2>Data controller</h2>
      <p>
        The data controller is PagoPilot&apos;s developer, reachable at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your email address and password (or, if you choose to sign
          in with Google, your name, email and profile picture provided by Google).
        </li>
        <li>
          <strong>Payment data:</strong> title, entity, amount, due date, category, notice number,
          creditor tax code, IBAN and notes you enter manually or that get extracted from an
          imported document.
        </li>
        <li>
          <strong>Uploaded documents:</strong> photos or PDFs of bills, PagoPA notices, F24 forms or
          receipts you import, stored in your private archive.
        </li>
        <li>
          <strong>Usage data:</strong> minimal technical information needed for the app to work,
          such as your monthly import count (to enforce the free plan&apos;s limit).
        </li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To create and manage your account and give you access to your payments.</li>
        <li>
          To automatically extract details from an imported document: the file is sent to
          Google&apos;s Gemini API solely to read its content, and is not used by Google to train
          its models.
        </li>
        <li>
          To send you reminders and due-date notifications, shown in-app or as on-device
          notifications (generated locally, without a server round-trip).
        </li>
        <li>To send you service emails: account confirmation, password reset.</li>
        <li>To manage an optional Premium subscription (see below).</li>
      </ul>

      <h2>Who we share data with</h2>
      <p>
        We never sell your data. We only share it with the technical providers needed to run the
        app:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, authentication and document storage.
        </li>
        <li>
          <strong>Google (Gemini API)</strong> — automatic reading of imported documents.
        </li>
        <li>
          <strong>Google Sign-In</strong> — only if you choose to sign in with your Google account.
        </li>
        <li>
          <strong>Resend</strong> — delivery of service emails (account confirmation, password
          reset).
        </li>
        <li>
          <strong>RevenueCat, Google Play and the Apple App Store</strong> — managing the Premium
          subscription. Payment is processed entirely by Google or Apple: PagoPilot never sees or
          stores your card details.
        </li>
      </ul>

      <h2>Data retention</h2>
      <p>
        We keep your data for as long as your account stays active. You can delete individual
        payments at any time from within the app. To request full deletion of your account and all
        associated data, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2>Your rights</h2>
      <p>
        If you&apos;re in the European Union, you have the right to access, correct, export or
        delete your data (GDPR rights). You can export your payments as a CSV file at any time from
        the Statistics or Settings section of the app. For any other request, contact us at the
        address above.
      </p>

      <h2>Security</h2>
      <p>
        Data is transmitted encrypted (HTTPS), and each user can only access their own payments and
        documents, enforced by database-level security policies (Row Level Security) configured on
        Supabase.
      </p>

      <h2>Children</h2>
      <p>
        PagoPilot is not directed at anyone under 16, and we do not knowingly collect data from
        children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated through
        the app or by email.
      </p>

      <h2>Contact</h2>
      <p>
        For any question about this policy or your data, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}
