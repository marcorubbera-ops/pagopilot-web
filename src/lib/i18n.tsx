/**
 * Minimal i18n layer. Italian is the default language, English is optional.
 * The chosen language is persisted in localStorage and applied to <html lang>.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "it" | "en";

export const LANGUAGES: { id: Lang; label: string; short: string }[] = [
  { id: "it", label: "Italiano", short: "IT" },
  { id: "en", label: "English", short: "EN" },
];

export const DEFAULT_LANG: Lang = "it";
const STORAGE_KEY = "pagopilot.lang";

const it = {
  "app.tagline": "Non dimenticare mai più un pagamento.",
  "app.name": "PagoPilot",

  "nav.home": "Home",
  "nav.documents": "Documenti",
  "nav.main": "Navigazione principale",

  "lang.label": "Lingua",
  "lang.switch": "Cambia lingua",

  "landing.hero":
    "Bollette, avvisi e tasse in un unico posto, senza stress — con promemoria puntuali prima della scadenza.",
  "landing.cta.primary": "Inizia gratis",
  "landing.cta.secondary": "Ho già un account",
  "landing.feature.import.title": "Importa ed estrai",
  "landing.feature.import.copy":
    "Fotografa una bolletta: i campi principali verranno compilati automaticamente.",
  "landing.feature.reminders.title": "Promemoria intelligenti",
  "landing.feature.reminders.copy": "Avvisi a 7, 3 e 1 giorno prima di ogni scadenza.",
  "landing.feature.calendar.title": "Vista calendario",
  "landing.feature.calendar.copy": "Tutti i pagamenti del mese in un colpo d'occhio.",
  "landing.feature.privacy.title": "La privacy prima di tutto",
  "landing.feature.privacy.copy":
    "I tuoi documenti restano riservati, protetti e accessibili solo a te.",

  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signin": "Accedi",
  "auth.signup": "Crea account",
  "auth.wait": "Attendi…",
  "auth.google": "Continua con Google",
  "auth.google.error": "Accesso con Google non riuscito. Riprova.",
  "auth.confirm":
    "Se è il tuo primo accesso, controlla la posta per confermare l'account. Se hai già un account con questa email, prova ad accedere o reimposta la password.",
  "auth.error": "Qualcosa è andato storto",
  "auth.error.invalid_credentials": "Email o password non corrette.",
  "auth.error.email_not_confirmed": "Devi prima confermare la tua email. Controlla la posta.",
  "auth.error.user_already_exists": "Esiste già un account con questa email. Prova ad accedere.",
  "auth.error.weak_password": "Password troppo debole. Usane una più lunga o complessa.",
  "auth.error.over_email_send_rate_limit": "Troppi tentativi. Riprova tra qualche minuto.",
  "auth.error.email_address_invalid": "Indirizzo email non valido.",
  "auth.error.same_password": "La nuova password deve essere diversa da quella attuale.",
  "auth.toSignup": "Nuovo su PagoPilot?",
  "auth.toSignin": "Hai già un account?",
  "auth.signout": "Esci",
  "auth.forgotPassword": "Hai dimenticato la password?",
  "auth.forgotPassword.needEmail": "Inserisci prima la tua email.",
  "auth.forgotPassword.sent":
    "Se l'indirizzo è registrato, riceverai un'email con le istruzioni per reimpostare la password.",
  "auth.reset.title": "Reimposta la password",
  "auth.reset.description": "Scegli una nuova password per il tuo account.",
  "auth.reset.newPassword": "Nuova password",
  "auth.reset.submit": "Reimposta password",
  "auth.reset.success": "Password aggiornata. Bentornato!",
  "auth.reset.invalidLink":
    "Questo link non è valido o è scaduto. Richiedi un nuovo link dalla pagina di accesso.",

  "home.stat.due": "Da pagare",
  "home.stat.soon": "In arrivo",
  "home.stat.overdue": "Scaduti",
  "home.stat.paid": "Pagati",
  "home.thisMonth": "Questo mese",
  "home.nextReminder": "Prossimo promemoria: {title} · {date}",
  "home.noReminders": "Nessun promemoria in arrivo",
  "home.quickAdd": "Aggiungi",
  "home.import": "Importa documento",
  "home.import.soon": "Import documenti e OCR arrivano nel prossimo passaggio.",
  "home.loading": "Caricamento pagamenti…",
  "home.empty.title": "Ancora nessun pagamento",
  "home.empty.copy": "Aggiungi la prima bolletta e PagoPilot la terrà d'occhio per te.",
  "home.recent": "Recenti",

  "docs.title": "Documenti",
  "docs.count.one": "{count} documento · {total}",
  "docs.count.other": "{count} documenti · {total}",
  "docs.search": "Cerca titolo, ente, numero avviso, tag…",
  "docs.filter.all": "Tutti",
  "docs.filter.open": "Da pagare",
  "docs.filter.paid": "Pagati",
  "docs.filter.soon": "In scadenza",
  "docs.filter.expired": "Scaduti",
  "docs.filter.month": "Questo mese",
  "docs.filter.year": "Quest'anno",
  "docs.loading": "Caricamento…",
  "docs.empty.title": "Nessun risultato",
  "docs.empty.copy": "Prova un altro filtro oppure aggiungi un pagamento con il pulsante +.",
  "docs.add": "Aggiungi pagamento",

  "detail.back": "Documenti",
  "detail.markPaid": "Segna pagato",
  "detail.markUnpaid": "Segna non pagato",
  "detail.attach": "Allega ricevuta",
  "detail.attach.soon": "Il caricamento delle ricevute arriva con la fase di import.",
  "detail.notFound": "Pagamento non trovato",
  "detail.backToDocs": "Torna ai documenti",
  "detail.loading": "Caricamento pagamento…",
  "detail.disclaimer":
    "Paga questo avviso nell'app IO o con la tua banca — PagoPilot si occupa solo di organizzarlo.",
  "detail.share": "Condividi",
  "detail.archive": "Archivia",
  "detail.delete": "Elimina",
  "detail.deleteConfirm": "Eliminare definitivamente questo pagamento?",
  "detail.copied": "{label} copiato",
  "detail.copy": "Copia {label}",
  "detail.sharedCopied": "Copiato negli appunti",
  "detail.created": "Creato",
  "detail.toast.paid": "Segnato come pagato",
  "detail.toast.reopened": "Riaperto",
  "detail.toast.archived": "Archiviato",
  "detail.toast.deleted": "Pagamento eliminato",

  "field.title": "Titolo",
  "field.amount": "Importo (€)",
  "field.dueDate": "Scadenza",
  "field.entity": "Ente",
  "field.category": "Categoria",
  "field.customCategory": "Categoria personalizzata",
  "form.ph.customCategory": "Es. Mensa scolastica",
  "field.noticeNumber": "Numero avviso",
  "field.taxCode": "Codice fiscale ente",
  "field.iban": "IBAN",
  "field.tags": "Tag",
  "field.notes": "Note",
  "field.none": "—",
  "field.noEntity": "Nessun ente",

  "form.title": "Nuovo pagamento",
  "form.description": "Inserisci quello che sai — il resto lo puoi completare dopo.",
  "form.save": "Salva pagamento",
  "form.saving": "Salvataggio…",
  "form.required.title": "Il titolo è obbligatorio",
  "form.required.amount": "L'importo è obbligatorio",
  "form.invalid.amount": "Inserisci un importo valido, maggiore di zero",
  "form.saved": "Pagamento salvato",
  "form.ph.title": "Bolletta luce marzo",
  "form.ph.amount": "86,40",
  "form.ph.entity": "Enel Energia",
  "form.ph.tags": "casa, trimestrale",
  "form.ph.notes": "Qualcosa da ricordare",

  "status.pending": "Da pagare",
  "status.due_today": "Scade oggi",
  "status.upcoming": "In scadenza",
  "status.paid": "Pagato",
  "status.expired": "Scaduto",
  "status.archived": "Archiviato",
  "status.cancelled": "Annullato",

  "due.none": "Nessuna scadenza",
  "due.today": "Scade oggi",
  "due.tomorrow": "Scade domani",
  "due.inDays": "Tra {days} giorni",
  "due.overdue.one": "Scaduto da 1 giorno",
  "due.overdue.other": "Scaduto da {days} giorni",
  "row.pendingInDays": "Scade tra {days} giorni",
  "row.upcomingTomorrow": "In scadenza domani",
  "row.upcomingInDays": "In scadenza tra {days} giorni",

  "category.home": "Casa",
  "category.utilities": "Utenze",
  "category.government": "Pubblica amministrazione",
  "category.taxes": "Tasse",
  "category.education": "Istruzione",
  "category.healthcare": "Salute",
  "category.transport": "Trasporti",
  "category.insurance": "Assicurazioni",
  "category.shopping": "Acquisti",
  "category.subscriptions": "Abbonamenti",
  "category.business": "Lavoro",
  "category.other": "Altro",

  "nav.calendar": "Calendario",
  "nav.stats": "Statistiche",
  "nav.settings": "Impostazioni",

  "import.title": "Importa documento",
  "import.description": "Carica una foto o un PDF: PagoPilot legge i dati e compila il modulo.",
  "import.choose": "Scegli file",
  "import.analyzing": "Lettura del documento…",
  "import.uploading": "Caricamento…",
  "detail.qr.title": "Codice QR di pagamento",
  "detail.qr.alt": "Codice QR per pagare {title}",
  "detail.qr.hint":
    "Inquadralo con l'app della banca o IO, oppure salvalo o condividilo per pagare da un altro dispositivo.",
  "detail.qr.save": "Salva immagine QR",
  "detail.qr.share": "Condividi",
  "detail.qr.shareFailed": "Condivisione non riuscita",
  "pay.title": "Paga ora",
  "pay.hint":
    "Ti portiamo sul sito ufficiale pagoPA: il codice avviso viene copiato, ti basta incollarlo con il codice fiscale dell'ente.",
  "pay.checkout": "Paga {amount} su pagoPA",
  "pay.io": "Apri l'app IO",
  "pay.io.hint": "Una volta aperta, scansiona il codice QR qui sotto per pagare.",
  "pay.copied": "Codice avviso copiato: {code}",
  "pay.now": "Paga",

  "import.success": "Dati estratti — controlla e salva.",
  "import.successQr": "Codice QR letto — importo e codice avviso verificati.",
  "import.fail": "Non riesco a leggere questo documento. Inseriscilo a mano.",
  "import.tooLarge": "File troppo grande (massimo 10 MB).",
  "import.review": "Controlla i dati",
  "import.hint": "Funziona con bollette, avvisi PagoPA, F24 e ricevute.",
  "import.limit.title": "Limite gratuito raggiunto",
  "import.limit.copy":
    "Il piano gratuito include {limit} importazioni al mese. Passa a Premium per importazioni illimitate.",
  "import.remaining": "{count} importazioni rimaste questo mese",
  "import.remaining.none": "Hai terminato le importazioni per questo mese",
  "import.attached": "Documento allegato",
  "import.multi.title.one": "Trovato {count} pagamento",
  "import.multi.title.other": "Trovati {count} pagamenti",
  "import.multi.description": "Questo documento contiene più scadenze. Scegli quali importare.",
  "import.multi.import.one": "Importa {count} pagamento",
  "import.multi.import.other": "Importa {count} pagamenti",
  "import.menu.pdf": "Importa PDF",
  "import.menu.image": "Importa immagine",
  "import.menu.camera": "Scatta una foto",
  "import.menu.scan": "Scansiona / Inquadra QR",
  "scan.title": "Inquadra l'avviso",
  "scan.description":
    "Punta la fotocamera sul codice QR PagoPA: viene letto da solo. Per una bolletta senza QR usa il pulsante di scatto.",
  "scan.searching": "Cerco un codice QR…",
  "scan.found": "Codice QR trovato",
  "scan.shoot": "Scatta",
  "scan.denied": "Fotocamera non disponibile. Consenti l'accesso o importa un file.",
  "common.cancel": "Annulla",

  "calendar.title": "Calendario",
  "calendar.subtitle": "Le scadenze del mese",
  "calendar.prev": "Mese precedente",
  "calendar.next": "Mese successivo",
  "calendar.today": "Oggi",
  "calendar.monthTotal": "Totale del mese",
  "calendar.selected": "Scadenze del {date}",
  "calendar.none": "Nessuna scadenza in questo giorno",

  "stats.title": "Statistiche",
  "stats.subtitle": "L'andamento dei tuoi pagamenti",
  "stats.total": "Totale pagato",
  "stats.openTotal": "Ancora da pagare",
  "stats.count": "Documenti",
  "stats.avg": "Importo medio",
  "stats.byCategory": "Per categoria",
  "stats.byMonth": "Ultimi 6 mesi",
  "stats.onTime": "Pagati in tempo",
  "stats.empty": "Aggiungi qualche pagamento per vedere le statistiche.",
  "stats.month": "Mensile",
  "stats.year": "Annuale",
  "stats.all": "Sempre",
  "stats.premium.title": "Statistiche avanzate",
  "stats.premium.copy":
    "Passa a Premium per sbloccare l'andamento mensile per categoria e l'esportazione dei dati.",
  "stats.export": "Esporta",
  "stats.exported": "Export creato",
  "stats.exportFailed": "Esportazione non riuscita",

  "export.menu.csv": "CSV",
  "export.menu.pdf": "PDF",
  "export.pdf.generatedOn": "Generato il {date}",
  "export.pdf.summary": "{count} pagamenti · totale {total}",
  "export.pdf.col.title": "Titolo",
  "export.pdf.col.entity": "Ente",
  "export.pdf.col.amount": "Importo",
  "export.pdf.col.due": "Scadenza",
  "export.pdf.col.status": "Stato",
  "export.pdf.col.category": "Categoria",

  "settings.title": "Impostazioni",
  "settings.account": "Account",
  "settings.language": "Lingua",
  "settings.plan": "Piano",
  "settings.plan.free": "Gratuito",
  "settings.plan.premium": "Premium",
  "settings.reminders": "Promemoria",
  "settings.reminders.copy": "Avvisi 7, 3 e 1 giorno prima della scadenza.",
  "settings.data": "I tuoi dati",
  "settings.export": "Esporta pagamenti",
  "settings.about": "Informazioni",
  "settings.about.copy":
    "PagoPilot ti aiuta a organizzare le scadenze. I pagamenti effettivi vanno eseguiti tramite la tua banca o l'app IO.",
  "legal.privacy": "Informativa sulla privacy",
  "legal.terms": "Termini di servizio",

  "premium.title": "PagoPilot Premium",
  "premium.copy": "Tutto senza limiti, per non perdere mai una scadenza.",
  "premium.benefit.imports": "Importazioni e OCR illimitati",
  "premium.benefit.stats": "Statistiche avanzate",
  "premium.benefit.storage": "Archivio documenti senza limiti",
  "premium.benefit.csv": "Esportazione CSV dei pagamenti",
  "premium.benefit.support": "Assistenza prioritaria",
  "premium.cta": "Attiva Premium",
  "premium.active": "Premium attivo",
  "premium.manage": "Disattiva Premium",
  "premium.activated": "Premium attivato",
  "premium.deactivated": "Premium disattivato",
  "premium.demo": "Gli acquisti Premium non sono ancora disponibili su questa build.",
  "premium.headline": "Non perdere mai più un pagamento.",
  "premium.subtitle": "Tieni ogni pagamento in ordine.",
  "premium.plan.monthly": "Mensile",
  "premium.plan.yearly": "Annuale",
  "premium.plan.lifetime": "Lifetime",
  "premium.plan.monthlyPrice": "0,99 €/mese",
  "premium.plan.yearlyPrice": "9,99 €/anno",
  "premium.plan.lifetimePrice": "29,99 € una tantum",
  "premium.plan.badge": "Risparmi il 16%",
  "premium.plan.lifetimeBadge": "Miglior offerta",
  "premium.trial": "14 giorni di prova gratuita, poi {price}. Disdici quando vuoi.",
  "premium.trialLifetime": "Pagamento unico di {price}. Nessun rinnovo.",
  "premium.continue": "Continua",
  "premium.restore": "Ripristina acquisti",
  "premium.later": "Forse più tardi",
  "premium.restored": "Nessun acquisto da ripristinare su questo account.",
  "premium.rc.unavailable": "Piano non disponibile al momento. Riprova più tardi.",

  "lock.title": "PagoPilot è bloccato",
  "lock.copy": "Sbloccalo con Face ID o Touch ID per vedere i tuoi pagamenti.",
  "lock.unlock": "Sblocca con Face ID",
  "lock.failed": "Sblocco non riuscito. Riprova.",
  "settings.security": "Sicurezza",
  "settings.lock": "Blocco con Face ID",
  "settings.lock.copy": "Richiedi Face ID o Touch ID all'apertura dell'app.",
  "settings.lock.on": "Blocco Face ID attivato",
  "settings.lock.off": "Blocco Face ID disattivato",
  "settings.lock.unsupported": "Questo dispositivo o browser non supporta Face ID / Touch ID.",
  "settings.lock.error": "Non è stato possibile attivare il blocco.",

  "reminders.title": "Promemoria",
  "reminders.empty": "Nessun promemoria in arrivo",
  "reminders.days": "tra {days} giorni",
  "reminders.today": "oggi",
  "reminders.tomorrow": "domani",
} as const;

export type TranslationKey = keyof typeof it;

const en: Record<TranslationKey, string> = {
  "app.tagline": "Never forget a payment again.",
  "app.name": "PagoPilot",

  "nav.home": "Home",
  "nav.documents": "Documents",
  "nav.main": "Main navigation",

  "lang.label": "Language",
  "lang.switch": "Change language",

  "landing.hero":
    "Every bill, notice and tax payment in one calm place — with reminders before it's too late.",
  "landing.cta.primary": "Get started free",
  "landing.cta.secondary": "I already have an account",
  "landing.feature.import.title": "Import & extract",
  "landing.feature.import.copy": "Snap a bill and the key details fill themselves in.",
  "landing.feature.reminders.title": "Smart reminders",
  "landing.feature.reminders.copy": "Nudges at 7, 3 and 1 day before every due date.",
  "landing.feature.calendar.title": "Calendar view",
  "landing.feature.calendar.copy": "See the whole month of payments at a glance.",
  "landing.feature.privacy.title": "Private by default",
  "landing.feature.privacy.copy": "Your documents stay yours — protected and yours alone.",

  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signin": "Sign in",
  "auth.signup": "Create account",
  "auth.wait": "Please wait…",
  "auth.google": "Continue with Google",
  "auth.google.error": "Google sign-in failed. Please try again.",
  "auth.confirm":
    "If this is your first time, check your email to confirm your account. If you already have an account with this email, try logging in or resetting your password.",
  "auth.error": "Something went wrong",
  "auth.error.invalid_credentials": "Incorrect email or password.",
  "auth.error.email_not_confirmed": "Please confirm your email first — check your inbox.",
  "auth.error.user_already_exists": "An account with this email already exists. Try signing in.",
  "auth.error.weak_password": "That password is too weak. Use something longer or more complex.",
  "auth.error.over_email_send_rate_limit": "Too many attempts. Please try again in a few minutes.",
  "auth.error.email_address_invalid": "That email address isn't valid.",
  "auth.error.same_password": "Your new password must be different from your current one.",
  "auth.toSignup": "New to PagoPilot?",
  "auth.toSignin": "Already have an account?",
  "auth.signout": "Sign out",
  "auth.forgotPassword": "Forgot your password?",
  "auth.forgotPassword.needEmail": "Enter your email first.",
  "auth.forgotPassword.sent":
    "If that address is registered, you'll get an email with reset instructions.",
  "auth.reset.title": "Reset your password",
  "auth.reset.description": "Choose a new password for your account.",
  "auth.reset.newPassword": "New password",
  "auth.reset.submit": "Reset password",
  "auth.reset.success": "Password updated. Welcome back!",
  "auth.reset.invalidLink":
    "This link is invalid or expired. Request a new one from the sign-in page.",

  "home.stat.due": "Payments due",
  "home.stat.soon": "Expiring soon",
  "home.stat.overdue": "Overdue",
  "home.stat.paid": "Paid",
  "home.thisMonth": "This month",
  "home.nextReminder": "Next reminder: {title} · {date}",
  "home.noReminders": "No upcoming reminders",
  "home.quickAdd": "Quick add",
  "home.import": "Import document",
  "home.import.soon": "Document import & OCR arrive in the next step.",
  "home.loading": "Loading your payments…",
  "home.empty.title": "No payments yet",
  "home.empty.copy": "Add your first bill with Quick add and PagoPilot will keep track of it.",
  "home.recent": "Recent",

  "docs.title": "Documents",
  "docs.count.one": "{count} document · {total}",
  "docs.count.other": "{count} documents · {total}",
  "docs.search": "Search title, entity, notice number, tag…",
  "docs.filter.all": "All",
  "docs.filter.open": "Pending",
  "docs.filter.paid": "Paid",
  "docs.filter.soon": "Due soon",
  "docs.filter.expired": "Overdue",
  "docs.filter.month": "This month",
  "docs.filter.year": "This year",
  "docs.loading": "Loading…",
  "docs.empty.title": "Nothing here",
  "docs.empty.copy": "Try another filter, or add a payment with the + button.",
  "docs.add": "Add payment",

  "detail.back": "Documents",
  "detail.markPaid": "Mark paid",
  "detail.markUnpaid": "Mark unpaid",
  "detail.attach": "Attach receipt",
  "detail.attach.soon": "Receipt upload arrives with the import step.",
  "detail.notFound": "Payment not found",
  "detail.backToDocs": "Back to documents",
  "detail.loading": "Loading payment…",
  "detail.disclaimer":
    "Pay this notice in the official IO app or your banking app — PagoPilot only keeps it organised.",
  "detail.share": "Share",
  "detail.archive": "Archive",
  "detail.delete": "Delete",
  "detail.deleteConfirm": "Delete this payment permanently?",
  "detail.copied": "{label} copied",
  "detail.copy": "Copy {label}",
  "detail.sharedCopied": "Copied to clipboard",
  "detail.created": "Created",
  "detail.toast.paid": "Marked as paid",
  "detail.toast.reopened": "Reopened",
  "detail.toast.archived": "Archived",
  "detail.toast.deleted": "Payment deleted",

  "field.title": "Title",
  "field.amount": "Amount (€)",
  "field.dueDate": "Due date",
  "field.entity": "Entity",
  "field.category": "Category",
  "field.customCategory": "Custom category",
  "form.ph.customCategory": "E.g. School canteen",
  "field.noticeNumber": "Notice number",
  "field.taxCode": "Entity tax code",
  "field.iban": "IBAN",
  "field.tags": "Tags",
  "field.notes": "Notes",
  "field.none": "—",
  "field.noEntity": "No entity",

  "form.title": "New payment",
  "form.description": "Fill in what you know — you can edit the rest later.",
  "form.save": "Save payment",
  "form.saving": "Saving…",
  "form.required.title": "Title is required",
  "form.required.amount": "Amount is required",
  "form.invalid.amount": "Enter a valid amount greater than zero",
  "form.saved": "Payment saved",
  "form.ph.title": "Electricity bill March",
  "form.ph.amount": "86.40",
  "form.ph.entity": "Enel Energia",
  "form.ph.tags": "home, quarterly",
  "form.ph.notes": "Anything worth remembering",

  "status.pending": "Pending",
  "status.due_today": "Due today",
  "status.upcoming": "Due soon",
  "status.paid": "Paid",
  "status.expired": "Overdue",
  "status.archived": "Archived",
  "status.cancelled": "Cancelled",

  "due.none": "No due date",
  "due.today": "Due today",
  "due.tomorrow": "Due tomorrow",
  "due.inDays": "In {days} days",
  "due.overdue.one": "1 day overdue",
  "due.overdue.other": "{days} days overdue",
  "row.pendingInDays": "Due in {days} days",
  "row.upcomingTomorrow": "Due tomorrow",
  "row.upcomingInDays": "Due in {days} days",

  "category.home": "Home",
  "category.utilities": "Utilities",
  "category.government": "Government",
  "category.taxes": "Taxes",
  "category.education": "Education",
  "category.healthcare": "Healthcare",
  "category.transport": "Transport",
  "category.insurance": "Insurance",
  "category.shopping": "Shopping",
  "category.subscriptions": "Subscriptions",
  "category.business": "Business",
  "category.other": "Other",

  "nav.calendar": "Calendar",
  "nav.stats": "Stats",
  "nav.settings": "Settings",

  "import.title": "Import document",
  "import.description": "Upload a photo or a PDF: PagoPilot reads the details and fills the form.",
  "import.choose": "Choose file",
  "import.analyzing": "Reading your document…",
  "import.uploading": "Uploading…",
  "detail.qr.title": "Payment QR code",
  "detail.qr.alt": "QR code to pay {title}",
  "detail.qr.hint": "Scan it with your bank app or IO, or save or share it to pay from another device.",
  "detail.qr.save": "Save QR image",
  "detail.qr.share": "Share",
  "detail.qr.shareFailed": "Couldn't share",
  "pay.title": "Pay now",
  "pay.hint":
    "We open the official pagoPA site: the notice code is copied, just paste it along with the payee tax code.",
  "pay.checkout": "Pay {amount} on pagoPA",
  "pay.io": "Open the IO app",
  "pay.io.hint": "Once it's open, scan the QR code below to pay.",
  "pay.copied": "Notice code copied: {code}",
  "pay.now": "Pay",

  "import.success": "Details extracted — review and save.",
  "import.successQr": "QR code read — amount and notice number verified.",
  "import.fail": "I couldn't read this document. Please enter it manually.",
  "import.tooLarge": "File too large (10 MB max).",
  "import.review": "Review the details",
  "import.hint": "Works with utility bills, PagoPA notices, F24 forms and receipts.",
  "import.limit.title": "Free limit reached",
  "import.limit.copy":
    "The free plan includes {limit} imports per month. Go Premium for unlimited imports.",
  "import.remaining": "{count} imports left this month",
  "import.remaining.none": "You've used all your imports for this month",
  "import.attached": "Document attached",
  "import.multi.title.one": "Found {count} payment",
  "import.multi.title.other": "Found {count} payments",
  "import.multi.description":
    "This document contains multiple due dates. Choose which ones to import.",
  "import.multi.import.one": "Import {count} payment",
  "import.multi.import.other": "Import {count} payments",
  "import.menu.pdf": "Import PDF",
  "import.menu.image": "Import image",
  "import.menu.camera": "Take a picture",
  "import.menu.scan": "Scan / Frame QR",
  "scan.title": "Frame the notice",
  "scan.description":
    "Point the camera at the PagoPA QR code — it is read automatically. For a bill without a QR code, use the shutter button.",
  "scan.searching": "Looking for a QR code…",
  "scan.found": "QR code found",
  "scan.shoot": "Capture",
  "scan.denied": "Camera unavailable. Allow access or import a file instead.",
  "common.cancel": "Cancel",

  "calendar.title": "Calendar",
  "calendar.subtitle": "This month's due dates",
  "calendar.prev": "Previous month",
  "calendar.next": "Next month",
  "calendar.today": "Today",
  "calendar.monthTotal": "Month total",
  "calendar.selected": "Due on {date}",
  "calendar.none": "Nothing due on this day",

  "stats.title": "Statistics",
  "stats.subtitle": "How your payments are going",
  "stats.total": "Total paid",
  "stats.openTotal": "Still to pay",
  "stats.count": "Documents",
  "stats.avg": "Average payment",
  "stats.byCategory": "By category",
  "stats.byMonth": "Last 6 months",
  "stats.onTime": "Paid on time",
  "stats.empty": "Add a few payments to see your statistics.",
  "stats.month": "Monthly",
  "stats.year": "Year",
  "stats.all": "All time",
  "stats.premium.title": "Advanced statistics",
  "stats.premium.copy": "Premium unlocks category and monthly trends, plus data export.",
  "stats.export": "Export",
  "stats.exported": "Export created",
  "stats.exportFailed": "Export failed",

  "export.menu.csv": "CSV",
  "export.menu.pdf": "PDF",
  "export.pdf.generatedOn": "Generated on {date}",
  "export.pdf.summary": "{count} payments · total {total}",
  "export.pdf.col.title": "Title",
  "export.pdf.col.entity": "Entity",
  "export.pdf.col.amount": "Amount",
  "export.pdf.col.due": "Due date",
  "export.pdf.col.status": "Status",
  "export.pdf.col.category": "Category",

  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.language": "Language",
  "settings.plan": "Plan",
  "settings.plan.free": "Free",
  "settings.plan.premium": "Premium",
  "settings.reminders": "Reminders",
  "settings.reminders.copy": "In-app nudges 7, 3 and 1 day before every due date.",
  "settings.data": "Your data",
  "settings.export": "Export payments",
  "settings.about": "About",
  "settings.about.copy":
    "PagoPilot keeps your payments organised. Actual payments always happen through your bank or the official IO app.",
  "legal.privacy": "Privacy Policy",
  "legal.terms": "Terms of Service",

  "premium.title": "PagoPilot Premium",
  "premium.copy": "Everything unlimited, so you never miss a due date.",
  "premium.benefit.imports": "Unlimited imports and OCR",
  "premium.benefit.stats": "Advanced statistics",
  "premium.benefit.storage": "Unlimited document archive",
  "premium.benefit.csv": "CSV export of your payments",
  "premium.benefit.support": "Priority support",
  "premium.cta": "Go Premium",
  "premium.active": "Premium active",
  "premium.manage": "Turn off Premium",
  "premium.activated": "Premium activated",
  "premium.deactivated": "Premium turned off",
  "premium.demo": "Premium purchases aren't available in this build yet.",
  "premium.headline": "Never miss another payment.",
  "premium.subtitle": "Keep every payment organized.",
  "premium.plan.monthly": "Monthly",
  "premium.plan.yearly": "Yearly",
  "premium.plan.lifetime": "Lifetime",
  "premium.plan.monthlyPrice": "€0.99/month",
  "premium.plan.yearlyPrice": "€9.99/year",
  "premium.plan.lifetimePrice": "€29.99 one-time",
  "premium.plan.badge": "Save 16%",
  "premium.plan.lifetimeBadge": "Best value",
  "premium.trial": "14-day free trial, then {price}. Cancel anytime.",
  "premium.trialLifetime": "One-time payment of {price}. No renewals.",
  "premium.continue": "Continue",
  "premium.restore": "Restore purchases",
  "premium.later": "Maybe later",
  "premium.restored": "No purchases to restore on this account.",
  "premium.rc.unavailable": "This plan is not available right now. Please try again later.",

  "lock.title": "PagoPilot is locked",
  "lock.copy": "Unlock with Face ID or Touch ID to see your payments.",
  "lock.unlock": "Unlock with Face ID",
  "lock.failed": "Unlock failed. Please try again.",
  "settings.security": "Security",
  "settings.lock": "Face ID lock",
  "settings.lock.copy": "Ask for Face ID or Touch ID every time you open the app.",
  "settings.lock.on": "Face ID lock enabled",
  "settings.lock.off": "Face ID lock disabled",
  "settings.lock.unsupported": "This device or browser does not support Face ID / Touch ID.",
  "settings.lock.error": "Could not enable the lock.",

  "reminders.title": "Reminders",
  "reminders.empty": "No upcoming reminders",
  "reminders.days": "in {days} days",
  "reminders.today": "today",
  "reminders.tomorrow": "tomorrow",
};

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { it, en };

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Builds a translate function for a language; usable outside React too. */
export function getTranslator(lang: Lang): Translate {
  const dict = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];
  return (key, vars) => {
    let value: string = dict[key] ?? DICTIONARIES[DEFAULT_LANG][key] ?? key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(replacement));
      }
    }
    return value;
  };
}

export const LOCALES: Record<Lang, string> = { it: "it-IT", en: "en-GB" };

type I18nValue = { lang: Lang; setLang: (lang: Lang) => void; t: Translate; locale: string };

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLang(fallback: Lang): Lang {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "it" ? stored : fallback;
}

export function I18nProvider({
  children,
  initialLang = DEFAULT_LANG,
}: {
  children: ReactNode;
  /** Server-detected language (e.g. from Accept-Language) to use before any stored preference exists. */
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    setLangState(readStoredLang(initialLang));
  }, [initialLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: getTranslator(lang), locale: LOCALES[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
