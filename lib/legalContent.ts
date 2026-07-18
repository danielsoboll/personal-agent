import { APP_NAME } from '@/lib/appIcon'

export const LEGAL_APP_NAME = APP_NAME
export const LEGAL_PLUS_NAME = `${APP_NAME} PLUS`

export type LegalSection = {
  title: string
  paragraphs: string[]
  listItems?: string[]
}

/** Kurzhinweis vor Stripe-Checkout — digitaler Dienst, Widerruf erlischt mit Bereitstellung. */
export const LEGAL_PLUS_CHECKOUT_NOTICE =
  'PLUS ist ein digitaler Dienst und wird nach Zahlung sofort freigeschaltet. Mit Abschluss des Checkouts stimmen Sie zu, dass wir vor Ablauf der 14-tägigen Widerrufsfrist beginnen; Ihr Widerrufsrecht erlischt mit Bereitstellung (AGB § 7 und 8).'

export const LEGAL_PLUS_CHECKOUT_PREFIX =
  'Mit Fortfahren zu Stripe schließen Sie ein monatliches PLUS-Abo ab (9,99 €/Monat, jederzeit kündbar). ' +
  LEGAL_PLUS_CHECKOUT_NOTICE +
  ' Es gelten unsere'

export const IMPRESSUM_SECTIONS: LegalSection[] = [
  {
    title: 'Angaben gemäß § 5 DDG',
    paragraphs: [
      'SLC IT-Consulting GmbH',
      'Wenkenstr. 67',
      '32105 Bad Salzuflen',
      'Deutschland',
    ],
  },
  {
    title: 'Vertreten durch',
    paragraphs: ['Geschäftsführer: Dipl.-Ing. (FH) Daniel Soboll'],
  },
  {
    title: 'Kontakt',
    paragraphs: ['E-Mail: d.soboll@slc-it.de'],
  },
  {
    title: 'Registereintrag',
    paragraphs: [
      'Eintragung im Handelsregister.',
      'Registergericht: Amtsgericht Detmold',
      'Registernummer: HRB 8476',
    ],
  },
  {
    title: 'Umsatzsteuer-ID',
    paragraphs: [
      'Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:',
      'DE286958761',
    ],
  },
  {
    title: 'Steuer-Identifikationsnummer',
    paragraphs: ['313/5802/1643'],
  },
  {
    title: 'Angebot',
    paragraphs: [
      `${LEGAL_APP_NAME} ist eine webbasierte Progressive Web App (PWA), die Nutzerinnen und Nutzern hilft, Briefe, Anträge und Behördenpost zu fotografieren, einzuordnen und nächste Schritte zu verstehen. Fälle und Fallakten werden primär lokal auf dem Gerät gespeichert; zur Auswertung werden Dokumente an eine KI-Schnittstelle übermittelt. Optional ist ein kostenpflichtiger Tarif „${LEGAL_PLUS_NAME}“ vorgesehen.`,
      'Vertragsbedingungen für die Nutzung und das PLUS-Abo finden Sie in unseren AGB — einschließlich Hinweisen zum Widerrufsrecht bei digitalen Diensten. Datenschutz und Haftung sind unter den jeweiligen Seiten abrufbar.',
    ],
  },
  {
    title: 'Zahlungsabwicklung (PLUS)',
    paragraphs: [
      'Die Bezahlung des PLUS-Abos erfolgt über den Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd.). Vertragspartner für die App-Leistung bleibt die SLC IT-Consulting GmbH; Zahlungsdaten werden im Rahmen des Checkouts von Stripe verarbeitet (siehe Datenschutzerklärung).',
    ],
  },
  {
    title: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
    paragraphs: [
      'Dipl.-Ing. (FH) Daniel Soboll',
      'SLC IT-Consulting GmbH',
      'Wenkenstr. 67, 32105 Bad Salzuflen',
    ],
  },
  {
    title: 'EU-Streitschlichtung',
    paragraphs: [
      'Die Europäische Kommission stellt eine Plattform zur Online-Streitschbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/',
      'Unsere E-Mail-Adresse finden Sie oben im Impressum.',
    ],
  },
  {
    title: 'Verbraucherstreitbeilegung / Universalschlichtungsstelle',
    paragraphs: [
      'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    ],
  },
  {
    title: 'Haftungshinweis',
    paragraphs: [
      'Ausführliche Hinweise zur Haftung für Inhalte, Links und die Nutzung der App finden Sie auf der Seite Haftung.',
    ],
  },
]

export const DATENSCHUTZ_SECTIONS: LegalSection[] = [
  {
    title: '1. Verantwortlicher',
    paragraphs: [
      `Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist der in unserem Impressum genannte Anbieter von ${LEGAL_APP_NAME}.`,
      'Bei Fragen zum Datenschutz können Sie uns über die dort angegebene Kontaktadresse erreichen.',
    ],
  },
  {
    title: '2. Überblick',
    paragraphs: [
      `${LEGAL_APP_NAME} hilft Ihnen, Post und Behördenschreiben zu verstehen: Sie legen Fälle an, fotografieren Dokumente und erhalten Einordnungen sowie nächste Schritte.`,
      'Ihre Fälle, Fallakten (JSONL), Bewertungen und erstellte Word-Schreiben werden standardmäßig lokal auf Ihrem Gerät gespeichert (IndexedDB, localStorage). Zur Auswertung werden Dokumente und Fallinformationen über unsere Server an OpenAI (API) übermittelt.',
      'Diese Datenschutzerklärung erläutert, welche Daten verarbeitet werden, zu welchem Zweck, auf welcher Rechtsgrundlage und welche Rechte Sie haben.',
    ],
  },
  {
    title: '3. Welche Daten wir verarbeiten',
    paragraphs: ['Je nach Nutzung können insbesondere folgende Daten anfallen:'],
    listItems: [
      'Profil- und Falldaten (Vorname, Fallname, Fallnummer, Status, Zeitstempel)',
      'Fallakte und Bewertungen (interne JSONL-Struktur, Zusammenfassungen, Schritte, Fristen — abgeleitet aus Ihren Dokumenten)',
      'Dokumente von Briefen und Unterlagen (temporär lokal, zur Auswertung an die KI übermittelt; verarbeitete Dokumente werden lokal gelöscht)',
      'Generierte Word-Dokumente in der Bibliothek (lokal auf dem Gerät)',
      'Technische Einstellungen (Theme, Entwürfe, aktiver Fall) in localStorage',
      'Bei PLUS-Abschluss (geplant): Stripe-Kunden- und Abo-Kennungen, Zahlungsstatus (keine vollständigen Kartendaten bei uns)',
      'Bei aktivem PLUS optional: verschlüsselte Falldaten in der Cloud (DSGVO-konform, EU-Hosting — nur bei expliziter Aktivierung; Wiederherstellung auf dem Gerät)',
      'Technische Zugriffsdaten (z. B. IP-Adresse, Zeitstempel) beim Hosting der App und API-Routen',
    ],
  },
  {
    title: '4. KI-Auswertung über OpenAI',
    paragraphs: [
      'Zur Analyse senden wir Dokumente, Ihren Vornamen, Fallnamen und — bei Folgeprüfungen — Inhalte der lokalen Fallakte an die OpenAI API. OpenAI verarbeitet diese Daten als Auftragsverarbeiter, soweit wir einen Auftragsverarbeitungsvertrag (DPA) abgeschlossen haben.',
      'Für die OpenAI API gilt standardmäßig: API-Daten werden nicht zum Training der Modelle verwendet. OpenAI kann Inhalte bis zu 30 Tage speichern, um Missbrauch zu erkennen und den Dienst zu betreiben. Eine kürzere Speicherung (Zero Data Retention) ist ggf. auf Anfrage möglich.',
      'OpenAI kann als US-Anbieter Daten in Drittländer übermitteln. Die Übermittlung erfolgt auf Grundlage geeigneter Garantien (z. B. Standardvertragsklauseln), soweit erforderlich.',
      'Weitere Informationen: https://openai.com/enterprise-privacy/ und https://developers.openai.com/api/docs/guides/your-data',
    ],
  },
  {
    title: '5. Zweck der Verarbeitung',
    paragraphs: ['Wir verarbeiten Daten, um'],
    listItems: [
      `${LEGAL_APP_NAME} bereitzustellen und Fälle auf Ihrem Gerät zu verwalten`,
      'Dokumente und Fallakten per KI auszuwerten und verständliche Schritte anzuzeigen',
      'Word-Schreiben vorzubereiten und lokal in der Bibliothek zu speichern',
      'das PLUS-Abo zu verwalten, zu verlängern und den Leistungsumfang freizuschalten (sofern gebucht)',
      'Stabilität, Sicherheit und Weiterentwicklung der App sicherzustellen',
      'gesetzliche Pflichten zu erfüllen (z. B. steuerliche Aufbewahrung bei Zahlungen)',
    ],
  },
  {
    title: '6. Rechtsgrundlagen',
    paragraphs: ['Die Verarbeitung erfolgt je nach Kontext auf folgenden Rechtsgrundlagen der DSGVO:'],
    listItems: [
      'Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung bzw. vorvertragliche Maßnahmen (Nutzung der App, PLUS-Abo)',
      'Art. 6 Abs. 1 lit. a DSGVO — Einwilligung, soweit Sie optional zustimmen (z. B. PWA-Installation, sofern erforderlich)',
      'Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an sicherem Betrieb, Missbrauchsprävention und technischer Administration',
      'Art. 6 Abs. 1 lit. c DSGVO — rechtliche Verpflichtungen (z. B. Aufbewahrung von Rechnungsdaten)',
    ],
  },
  {
    title: '7. Speicherung auf Ihrem Gerät (TDDDG, IndexedDB, localStorage)',
    paragraphs: [
      'Fälle, Fallakten, Bewertungen, Bibliotheksdokumente und — bis zur Verarbeitung — Dokumente werden lokal in IndexedDB gespeichert. Vorname, Theme und der aktive Fall werden in localStorage zwischengespeichert.',
      'Diese lokale Speicherung dient der App-Funktion auf Ihrem Gerät. Sie können lokale Daten über Browser- oder Geräteeinstellungen löschen; dabei gehen Ihre Fälle auf diesem Gerät verloren.',
      'Technisch notwendige Cookies oder vergleichbare Speicher können für den Betrieb der PWA erforderlich sein (§ 25 Abs. 2 Nr. 2 TDDDG).',
    ],
  },
  {
    title: '8. Hosting und Server',
    paragraphs: [
      'Die App wird über Hosting-Dienstleister (z. B. Vercel) ausgeliefert. API-Routen zur KI-Anbindung laufen auf unserer Server-Infrastruktur; dabei werden Anfrageninhalte zur Weiterleitung an OpenAI verarbeitet, ohne dass wir Fallakten dauerhaft auf dem Server speichern, sofern nicht ausdrücklich anders beschrieben.',
      'Für optionale Kontofunktionen und PLUS kann Supabase als Auftragsverarbeiter nach Art. 28 DSGVO eingesetzt werden. Derzeit liegt der Schwerpunkt auf lokaler Speicherung auf dem Gerät; optionaler Cloud-Speicher für PLUS wird nur nach Ihrer aktiven Einwilligung bzw. Buchung genutzt.',
      'Technische Zugriffsdaten werden vom Hosting-Anbieter verarbeitet, soweit dies für Auslieferung, Sicherheit und Fehleranalyse erforderlich ist.',
    ],
  },
  {
    title: '9. Zahlungsabwicklung über Stripe (PLUS)',
    paragraphs: [
      `Für ${LEGAL_PLUS_NAME} nutzen wir Stripe als Zahlungsdienstleister. Beim Checkout werden Sie zu Stripe weitergeleitet. Dort geben Sie Zahlungsdaten (z. B. Karte) direkt bei Stripe ein.`,
      'Wir erhalten von Stripe u. a. Kundenkennung, Abo-Status, Vertragszeiträume und Zahlungsereignisse, um PLUS freizuschalten und zu verwalten. Vollständige Kartendaten speichern wir nicht.',
      'Stripe kann Daten als eigenständiger Verantwortlicher oder Auftragsverarbeiter verarbeiten. Informationen finden Sie in der Datenschutzerklärung von Stripe: https://stripe.com/de/privacy',
    ],
  },
  {
    title: '10. Progressive Web App (PWA)',
    paragraphs: [
      `Wenn Sie ${LEGAL_APP_NAME} zum Startbildschirm hinzufügen, wird die App lokal zwischengespeichert (Service Worker / App-Cache), damit sie schneller startet.`,
      'Push-Benachrichtigungen oder Standortdaten werden derzeit nicht abgefragt, sofern in der App nicht ausdrücklich anders angegeben.',
    ],
  },
  {
    title: '11. Weitergabe an Dritte',
    paragraphs: [
      'Wir verkaufen Ihre Daten nicht. Eine Weitergabe erfolgt nur, wenn dies zur Vertragserfüllung notwendig ist (z. B. an OpenAI zur Auswertung, Hosting-Anbieter, Stripe bei PLUS), wir gesetzlich dazu verpflichtet sind oder Sie eingewilligt haben.',
      'Empfänger sind vertraglich verpflichtet, Daten nur nach Weisung und unter Einhaltung des Datenschutzes zu verarbeiten.',
    ],
  },
  {
    title: '12. Speicherdauer',
    paragraphs: [
      'Lokal auf dem Gerät bleiben Ihre Fälle gespeichert, bis Sie sie löschen oder App-Daten im Browser entfernen.',
      'Bei OpenAI gelten die Speicherfristen des API-Anbieters (standardmäßig bis zu 30 Tage für Missbrauchsprüfung, sofern keine kürzere Vereinbarung besteht).',
      'Abo- und Zahlungsbezogene Daten können wir für die Dauer gesetzlicher Aufbewahrungsfristen (z. B. steuer- und handelsrechtlich) vorhalten.',
      'Technische Protokolldaten beim Hosting werden in der Regel nur kurzzeitig vorgehalten.',
    ],
  },
  {
    title: '13. Ihre Rechte',
    paragraphs: [
      'Sie haben gegenüber dem Verantwortlichen u. a. folgende Rechte:',
      'Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter der im Impressum genannten E-Mail-Adresse. Bitte geben Sie an, welcher Fall betroffen ist.',
    ],
    listItems: [
      'Auskunft über die verarbeiteten Daten (Art. 15 DSGVO)',
      'Berichtigung unrichtiger Daten (Art. 16 DSGVO)',
      'Löschung (Art. 17 DSGVO), soweit keine Aufbewahrungspflichten entgegenstehen',
      'Einschränkung der Verarbeitung (Art. 18 DSGVO)',
      'Datenübertragbarkeit (Art. 20 DSGVO)',
      'Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen (Art. 21 DSGVO)',
      'Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)',
    ],
  },
  {
    title: '14. Beschwerderecht',
    paragraphs: [
      'Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Mitgliedstaat Ihres gewöhnlichen Aufenthalts, Ihres Arbeitsplatzes oder des Ortes des mutmaßlichen Verstoßes.',
      'Zuständige Aufsichtsbehörde in Nordrhein-Westfalen: Landesbeauftragte für Datenschutz und Informationsfreiheit NRW, https://www.ldi.nrw.de',
    ],
  },
  {
    title: '15. Datensicherheit',
    paragraphs: [
      'Wir treffen angemessene technische und organisatorische Maßnahmen, um Ihre Daten vor Verlust, Missbrauch und unbefugtem Zugriff zu schützen. Absolute Sicherheit kann bei internetbasierten Diensten nicht garantiert werden.',
      'Schützen Sie Ihr Gerät mit Bildschirmsperre und löschen Sie sensible Fälle, wenn Sie das Gerät weitergeben.',
    ],
  },
  {
    title: '16. Änderungen dieser Datenschutzerklärung',
    paragraphs: [
      'Wir passen diese Erklärung an, wenn sich die App, eingesetzte Dienste oder rechtliche Anforderungen ändern. Die jeweils aktuelle Fassung ist unter /datenschutz abrufbar.',
      'Stand: Juli 2026',
    ],
  },
]

export const HAFTUNG_SECTIONS: LegalSection[] = [
  {
    title: 'Haftung für Inhalte',
    paragraphs: [
      'Als Diensteanbieter sind wir gemäß § 7 Abs. 1 des Digitale-Dienste-Gesetzes (DDG) für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Die Haftung für fremde bzw. von Nutzern bereitgestellte Informationen richtet sich nach § 7 DDG in Verbindung mit den Artikeln 4 bis 8 der Verordnung (EU) 2022/2065 über digitale Dienste (Digital Services Act, DSA).',
      'Bewertungen, Zusammenfassungen und Schritte werden automatisiert aus Ihren hochgeladenen Dokumenten erzeugt. Sie stellen keine Inhalte des Anbieters dar, sondern Hilfestellungen auf Basis Ihrer Eingaben. Verpflichtungen zur Entfernung oder Sperrung nach den allgemeinen Gesetzen bleiben unberührt.',
    ],
  },
  {
    title: 'Haftung für Links',
    paragraphs: [
      'Unser Angebot kann Links zu externen Websites Dritter enthalten (z. B. Stripe-Checkout, Stripe-Kundenportal, OpenAI-Dokumentation), auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte übernehmen wir keine Gewähr. Verantwortlich ist der jeweilige Anbieter oder Betreiber.',
      'Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.',
    ],
  },
  {
    title: 'Keine Rechts-, Steuer- oder Behördenberatung',
    paragraphs: [
      `${LEGAL_APP_NAME} unterstützt Sie beim Verstehen von Post und beim Strukturieren nächster Schritte. Die App ersetzt keine Rechtsberatung, Steuerberatung oder offizielle Auskunft einer Behörde.`,
      'KI-generierte Texte können unvollständig oder fehlerhaft sein. Prüfen Sie Fristen, Beträge und Pflichten stets am Originalbrief und holen Sie bei Bedarf professionelle Beratung ein. Entscheidungen treffen Sie in eigenverantwortlichem Ermessen.',
      'Für Schäden, die aus alleiniger Nutzung der App ohne fachliche Prüfung entstehen, übernehmen wir keine Haftung, soweit gesetzlich zulässig.',
    ],
  },
  {
    title: 'Verfügbarkeit, kostenlose und kostenpflichtige Funktionen',
    paragraphs: [
      `Wir bemühen uns um einen störungsfreien Betrieb von ${LEGAL_APP_NAME}. Wartung, Updates, Netzwerkprobleme, Störungen bei Drittanbietern (z. B. OpenAI, Hosting, Stripe) oder höhere Gewalt können jedoch zu vorübergehenden Einschränkungen führen.`,
      'Der kostenlose Funktionsumfang kann sich weiterentwickeln. PLUS-Funktionen werden schrittweise ausgebaut; ein Anspruch auf bestimmte noch angekündigte Features besteht nur im Rahmen der AGB und des jeweils gebuchten Leistungsumfangs.',
      'Bei Ausfall oder eingeschränkter Verfügbarkeit besteht — außerhalb der gesetzlichen Gewährleistungsrechte — kein Anspruch auf Schadensersatz, soweit gesetzlich zulässig.',
    ],
  },
  {
    title: 'Datenverlust und Gerätewechsel',
    paragraphs: [
      'Für den Verlust von lokal gespeicherten Falldaten infolge von Browser-Löschungen, Gerätewechsel, App-Löschung oder technischen Störungen auf dem Endgerät wird — soweit gesetzlich zulässig — keine Haftung übernommen, sofern kein vorsätzliches oder grob fahrlässiges Verschulden vorliegt.',
      'Sichern Sie wichtige Unterlagen und Word-Schreiben separat, bevor Sie Gerätedaten löschen.',
    ],
  },
  {
    title: 'Haftungsbeschränkung',
    paragraphs: [
      'Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung — soweit gesetzlich zulässig — ausgeschlossen.',
      'Dies gilt entsprechend für Erfüllungsgehilfen und gesetzliche Vertreter.',
    ],
  },
  {
    title: 'Urheberrecht',
    paragraphs: [
      'Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.',
    ],
  },
  {
    title: 'Stand',
    paragraphs: ['Stand: Juli 2026'],
  },
]

export const AGB_SECTIONS: LegalSection[] = [
  {
    title: '1. Geltungsbereich und Anbieter',
    paragraphs: [
      `Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der webbasierten Anwendung „${LEGAL_APP_NAME}“ (nachfolgend „App“) der SLC IT-Consulting GmbH, Wenkenstr. 67, 32105 Bad Salzuflen (nachfolgend „Anbieter“, „wir“).`,
      'Abweichende Bedingungen des Nutzers gelten nicht, es sei denn, wir stimmen ihrer Geltung ausdrücklich schriftlich zu.',
      'Die App richtet sich an Verbraucher im Sinne des § 13 BGB und kann auch von nicht-verbraucherischen Nutzern verwendet werden. Bei Widersprüchen zugunsten des Verbrauchers gehen zwingende Verbraucherschutzvorschriften vor.',
    ],
  },
  {
    title: '2. Leistungsgegenstand',
    paragraphs: [
      `${LEGAL_APP_NAME} ermöglicht es, Fälle anzulegen, Dokumente zu fotografieren, automatisierte Einordnungen und nächste Schritte zu erhalten sowie — im finalen Workflow — Word-Schreiben vorzubereiten.`,
      `Der kostenlose Tarif umfasst den Basisfunktionsumfang (derzeit: ein Fall prüfen, lokale Speicherung auf dem Gerät). Der kostenpflichtige Tarif „${LEGAL_PLUS_NAME}“ erweitert den Umfang unter anderem um:`,
    ],
    listItems: [
      'Behördenpost als dauerhaften KI-Agenten mit Fall-Historie',
      'Bis zu 10 Fälle parallel',
      'Optional externe, DSGVO-konforme Datenspeicherung mit Wiederherstellung auf dem Gerät',
      '100 KI-Anfragen pro Monat und 500 Seiten Text',
      'Dauerhafte Speicherung und Nutzung der verfügbaren Historie',
    ],
  },
  {
    title: '2a. Leistungsgegenstand — Hinweise',
    paragraphs: [
      'Einzelne PLUS-Funktionen (z. B. Cloud-Speicher, erweiterte Kontofunktionen) können schrittweise freigeschaltet werden. Der konkrete Umfang ergibt sich aus der App-Beschreibung zum Zeitpunkt der Buchung.',
      'Es besteht kein Anspruch auf ununterbrochene Verfügbarkeit. Wartung, Updates und Weiterentwicklung können die Nutzung vorübergehend einschränken. Die App ersetzt keine Rechts- oder Steuerberatung (siehe Haftung).',
    ],
  },
  {
    title: '3. Nutzung, Fälle und Gerätespeicher',
    paragraphs: [
      'Zur Nutzung legen Sie Fälle an. Fälle, Fallakten und Bewertungen werden primär lokal auf Ihrem Gerät gespeichert; Daten werden nur zur KI-Auswertung übermittelt.',
      'Sie sind dafür verantwortlich, Ihr Gerät zu schützen und Falldaten bei Weitergabe des Geräts zu löschen, soweit erforderlich.',
      'Für PLUS und optional künftige Kontofunktionen kann ein Nutzerkonto erforderlich werden; hierauf weisen wir bei Einführung gesondert hin.',
    ],
  },
  {
    title: '4. Vertragsschluss für PLUS',
    paragraphs: [
      'Die Darstellung von PLUS in der App stellt kein bindendes Angebot dar, sondern eine Einladung zur Abgabe einer Bestellung.',
      'Mit Klick auf den Checkout-Button und Abschluss des Zahlungsvorgangs bei Stripe geben Sie ein verbindliches Angebot zum Abschluss eines monatlichen PLUS-Abonnements ab. Der Vertrag kommt zustande, wenn wir die Bestellung annehmen — in der Regel durch Freischaltung von PLUS nach erfolgreicher Zahlung.',
      `PLUS ist ein digitaler Dienst ohne körperlichen Datenträger, der unmittelbar nach Vertragsschluss bereitgestellt wird. Mit Abschluss des Checkouts verlangen Sie ausdrücklich, dass ${LEGAL_PLUS_NAME} bereits vor Ablauf der 14-tägigen Widerrufsfrist bereitgestellt wird. Ihnen ist bekannt, dass Sie bei einem Widerruf gegebenenfalls Wertersatz für die bis dahin erbrachte Leistung schulden (§ 357 Abs. 8 BGB). Zugleich willigen Sie ein, dass wir vor Ablauf der Widerrufsfrist mit der Leistung beginnen, und bestätigen, dass Ihr Widerrufsrecht mit vollständiger Vertragserfüllung — spätestens mit Freischaltung von PLUS — erlischt (§ 356 Abs. 5 BGB; nähere Ausführungen in § 7 und 8).`,
      'Vertragssprache ist Deutsch. Der Vertragstext (AGB, Bestellübersicht) kann in der App abgespeichert bzw. ausgedruckt werden.',
    ],
  },
  {
    title: '5. Preise und Zahlung',
    paragraphs: [
      `Der Preis für ${LEGAL_PLUS_NAME} beträgt derzeit 9,99 € pro Monat. Alle Preise verstehen sich in Euro und enthalten die gesetzliche Umsatzsteuer, sofern anwendbar.`,
      'Die Zahlung erfolgt monatlich im Voraus über Stripe (Kreditkarte, Debitkarte oder andere von Stripe angebotene Zahlungsarten).',
      'Bei Zahlungsverzug oder fehlgeschlagenen Abbuchungen können wir PLUS vorübergehend sperren, bis der ausstehende Betrag beglichen ist.',
    ],
  },
  {
    title: '6. Laufzeit, Verlängerung und Kündigung',
    paragraphs: [
      'PLUS wird als monatliches Abonnement mit automatischer Verlängerung um jeweils einen Monat abgeschlossen, sofern nicht gekündigt wird.',
      'Sie können das Abo jederzeit zum Ende des laufenden Abrechnungszeitraums kündigen — über das Stripe-Kundenportal („Abo verwalten“ in den Einstellungen) oder per E-Mail an die im Impressum genannte Adresse.',
      'Nach Wirksamwerden der Kündigung endet PLUS mit Ablauf des bezahlten Zeitraums; es erfolgt keine anteilige Erstattung bereits gezahlter Monatsbeiträge, sofern nicht gesetzlich zwingend anders vorgeschrieben.',
      'Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.',
    ],
  },
  {
    title: '7. Widerrufsrecht für Verbraucher',
    paragraphs: [
      'Sofern Sie Verbraucher sind, steht Ihnen grundsätzlich ein Widerrufsrecht zu.',
      'Widerrufsbelehrung',
      'Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.',
      'Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.',
      'Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (SLC IT-Consulting GmbH, Wenkenstr. 67, 32105 Bad Salzuflen, E-Mail: d.soboll@slc-it.de) mittels einer eindeutigen Erklärung (z. B. per E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.',
      'Folgen des Widerrufs: Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart.',
    ],
    listItems: [
      `Muster-Widerrufsformular (freiwillige Nutzung): An SLC IT-Consulting GmbH, Wenkenstr. 67, 32105 Bad Salzuflen, E-Mail: d.soboll@slc-it.de — Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: ${LEGAL_PLUS_NAME} — Bestellt am (*)/erhalten am (*) — Name des/der Verbraucher(s) — Anschrift des/der Verbraucher(s) — Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier) — Datum — (*) Unzutreffendes streichen.`,
    ],
  },
  {
    title: '8. Digitale Leistung — Erlöschen des Widerrufsrechts',
    paragraphs: [
      `${LEGAL_PLUS_NAME} ist ein digitaler Dienst im Sinne des § 327 BGB, der nicht auf einem körperlichen Datenträger geliefert wird. Nach erfolgreicher Zahlung wird PLUS unverzüglich in der App freigeschaltet.`,
      'Wenn Sie als Verbraucher den Checkout abschließen, verlangen Sie ausdrücklich, dass wir mit der Bereitstellung von PLUS vor Ablauf der 14-tägigen Widerrufsfrist beginnen. Sie bestätigen zugleich Ihre Kenntnis davon, dass Sie Ihr Widerrufsrecht mit Beginn der Vertragserfüllung — spätestens mit Freischaltung von PLUS — verlieren (§ 356 Abs. 5 BGB).',
      'Ein Widerruf nach Freischaltung von PLUS ist damit ausgeschlossen. Stattdessen können Sie das Abo jederzeit zum Ende des laufenden Abrechnungszeitraums kündigen (§ 6).',
      'Haben Sie — entgegen der obigen Regelung — wirksam widerrufen, bevor PLUS freigeschaltet wurde, erstatten wir bereits gezahlte Beträge. Wurde PLUS bereits bereitgestellt, erlischt das Widerrufsrecht; es bleibt nur die ordentliche Kündigung des Abonnements.',
    ],
  },
  {
    title: '9. Nutzungsrechte',
    paragraphs: [
      'Wir räumen Ihnen ein einfaches, nicht übertragbares, nicht unterlizenzierbares Recht ein, die App für private Zwecke im Rahmen dieser AGB zu nutzen.',
      'Reverse Engineering, automatisiertes Auslesen, Weiterverkauf oder kommerzielle Nutzung ohne unsere Zustimmung sind untersagt.',
    ],
  },
  {
    title: '10. Pflichten der Nutzer',
    paragraphs: ['Sie verpflichten sich insbesondere,'],
    listItems: [
      'nur Dokumente zu verarbeiten, deren Verarbeitung Ihnen rechtlich zusteht',
      'keine rechtswidrigen Inhalte hochzuladen oder zu verbreiten',
      'KI-Hinweise kritisch zu prüfen und Fristen am Original zu verifizieren',
      'Ihr Gerät zu schützen und Falldaten bei Weitergabe zu löschen, soweit erforderlich',
      'keine Sicherheitsmechanismen zu umgehen und die App nicht missbräuchlich zu belasten',
    ],
  },
  {
    title: '11. Gewährleistung',
    paragraphs: [
      'Es gelten die gesetzlichen Gewährleistungsrechte. Bei digitalen Diensten schulden wir die Bereitstellung der vertraglich vereinbarten Funktionen; nicht jede angekündigte künftige Funktion muss bereits zum Buchungszeitpunkt vollständig implementiert sein, sofern der Kernleistungsumfang von PLUS erkennbar beschrieben ist.',
      'Bei Mängeln kontaktieren Sie uns unter der Impressums-Adresse. Wir bemühen uns um zeitnahe Abhilfe.',
    ],
  },
  {
    title: '12. Haftung',
    paragraphs: [
      'Weitere Haftungsregelungen finden Sie auf der Seite Haftung. Im Verhältnis zu Verbrauchern gelten die zwingenden gesetzlichen Haftungsvorschriften.',
      'Für leicht fahrlässige Pflichtverletzungen haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, typischen Schaden. Die Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie nach dem Produkthaftungsgesetz bleibt unberührt.',
    ],
  },
  {
    title: '13. Datenschutz',
    paragraphs: [
      'Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer Datenschutzerklärung unter /datenschutz.',
    ],
  },
  {
    title: '14. Änderungen der AGB und des Leistungsumfangs',
    paragraphs: [
      'Wir können diese AGB mit Wirkung für die Zukunft anpassen, wenn hierfür sachliche Gründe bestehen (z. B. Gesetzesänderungen, neue Funktionen, Preisanpassungen). Über wesentliche Änderungen informieren wir in der App oder per E-Mail. Widersprechen Verbraucher nicht innerhalb von sechs Wochen nach Zugang der Mitteilung, gelten die geänderten AGB als angenommen; hierauf weisen wir in der Mitteilung gesondert hin.',
      'Preiserhöhungen für laufende PLUS-Abos teilen wir rechtzeitig mit; Sie können in diesem Fall zum Zeitpunkt des Inkrafttretens kündigen.',
    ],
  },
  {
    title: '15. Schlussbestimmungen',
    paragraphs: [
      'Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern mit gewöhnlichem Aufenthalt in der EU bleiben zwingende Verbraucherschutzvorschriften des Aufenthaltsstaats unberührt.',
      'Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten Bad Salzuflen, sofern gesetzlich zulässig.',
      'Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen unberührt.',
      'Stand: Juli 2026',
    ],
  },
]
