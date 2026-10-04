export type LegalSection = { id: string; title: string; paragraphs: string[]; items?: string[] }
export type LegalDocument = {
  kind: "confidentialite" | "conditions-utilisation"
  title: string
  description: string
  highlights: { title: string; description: string }[]
  sections: LegalSection[]
}

export const privacyDocument: LegalDocument = {
  kind: "confidentialite",
  title: "Politique de confidentialité",
  description: "Comprendre quelles informations sont utilisées dans la plateforme CNAC, pourquoi elles le sont et comment exercer vos droits.",
  highlights: [
    { title: "Une finalité institutionnelle", description: "Les informations servent aux missions et à la gestion du CNAC." },
    { title: "Un accès réservé", description: "Les utilisateurs doivent être habilités et respecter la confidentialité." },
    { title: "Des droits à exercer", description: "Vous pouvez demander des informations et la correction de vos données." },
  ],
  sections: [
    { id: "responsable", title: "Qui est concerné et qui organise les traitements ?", paragraphs: [
      "Cette politique concerne les utilisateurs de la plateforme du Comité National Antidopage Congolais (CNAC), ainsi que les athlètes et les autres personnes dont les informations y sont enregistrées. La plateforme est un outil institutionnel destiné au personnel du CNAC et aux collaborateurs expressément habilités.",
      "Le CNAC définit les usages des informations dans le cadre de ses missions. Son administration est votre point de contact pour une question relative à vos données. L’accès à une fiche dans la plateforme n’autorise pas sa diffusion au public.",
    ] },
    { id: "donnees", title: "Quelles informations sont concernées ?", paragraphs: [
      "Les informations varient selon la fiche et les fonctions utilisées. Seules les données nécessaires à la tâche confiée doivent être saisies.",
    ], items: [
      "Comptes utilisateurs : identité, adresse email professionnelle, profil, habilitations et informations nécessaires à la connexion.",
      "Athlètes et autres acteurs : identité, sexe, date de naissance, coordonnées, identifiants et observations utiles au dossier.",
      "Affiliations : sport, discipline, fédération, structures territoriales, club et équipe, selon le dossier.",
      "Pièces jointes : photographie, document d’identité ou autre justificatif autorisé pour la fonction concernée.",
      "Données techniques : session, requêtes, informations de navigateur et journaux de sécurité ou d’activité lorsqu’ils sont activés.",
    ] },
    { id: "finalites", title: "Pourquoi ces informations sont-elles utilisées ?", paragraphs: [
      "La plateforme permet d’identifier les personnes, de tenir des dossiers fiables, de suivre les affiliations, de coordonner le travail des services et de contrôler les accès. Les informations techniques servent au fonctionnement du service, à sa maintenance et à la détection d’incidents.",
      "Les traitements doivent être rattachés aux missions du CNAC et à un fondement autorisé par le droit applicable : obligation légale, mission institutionnelle ou autre fondement approprié à l’opération. Un consentement spécifique doit être recueilli lorsqu’il est nécessaire. Consulter cette page ou se connecter ne constitue pas un consentement général à tout traitement.",
    ] },
    { id: "collecte", title: "D’où viennent les informations ?", paragraphs: [
      "Les données peuvent être fournies par la personne concernée, saisies par un agent habilité ou transmises par une structure sportive dans le cadre d’une procédure autorisée. L’utilisateur qui enregistre une information doit vérifier sa source, sa pertinence et, lorsque nécessaire, les justificatifs associés.",
      "Pour les mineurs, les démarches doivent respecter les règles applicables de représentation et d’information. Une donnée médicale, un diagnostic ou un résultat antidopage ne doit pas être ajouté à une zone d’observations générales.",
    ] },
    { id: "antidopage", title: "Qu’en est-il des données sensibles et des futurs modules ?", paragraphs: [
      "Les rubriques Contrôles, AUT (autorisations d’usage à des fins thérapeutiques) et Localisation sont actuellement annoncées comme à venir. Cette politique ne signifie pas qu’elles collectent déjà des résultats de contrôle, des dossiers médicaux ou des programmes de localisation.",
      "Avant l’ouverture d’un traitement de cette nature, le CNAC devra préciser les informations collectées, les personnes habilitées, les destinataires, les durées de conservation et les garanties propres à ce traitement. Une information complémentaire sera nécessaire pour ces données sensibles, en tenant compte des règles antidopage applicables.",
    ] },
    { id: "destinataires", title: "Qui peut accéder aux données ?", paragraphs: [
      "L’accès doit être limité aux agents et collaborateurs habilités dont la mission justifie la consultation. Les informations ne doivent pas être communiquées à un collègue, une fédération, un club ou un autre organisme au seul motif qu’il les demande.",
      "Une transmission à une autorité ou à un partenaire n’est permise que lorsqu’un cadre légal ou une procédure institutionnelle l’autorise, et pour les seules informations nécessaires. Le CNAC n’autorise pas l’utilisation des dossiers pour la prospection commerciale ou la constitution de fichiers personnels.",
    ] },
    { id: "hebergement", title: "Quels services techniques interviennent ?", paragraphs: [
      "La plateforme utilise Google Sheets pour les données structurées et Google Drive pour les fichiers des fonctions configurées. Le service en ligne est prévu pour être hébergé sur Vercel. Ces prestataires peuvent intervenir dans le stockage, l’hébergement et les opérations techniques nécessaires au service.",
      "Selon les contrats et la configuration retenus, des opérations de stockage ou de traitement peuvent avoir lieu hors de la République démocratique du Congo. Le CNAC doit vérifier les conditions de ces services et les garanties requises avant de leur confier les données concernées. Cette page ne garantit pas un hébergement exclusivement national.",
    ] },
    { id: "cookies", title: "Cookies et mesure d’utilisation", paragraphs: [
      "La connexion utilise un cookie de session pour reconnaître l’utilisateur pendant sa navigation. La session est prévue pour expirer au bout de huit heures ; la déconnexion supprime le cookie de session du navigateur. Bloquer les cookies nécessaires peut empêcher l’accès à l’espace de travail.",
      "Un composant Vercel Web Analytics est intégré à l’application. Lorsqu’il est activé sur l’hébergement, il peut mesurer les pages consultées et certaines informations techniques de navigation. Le CNAC doit veiller à ne pas transmettre d’identifiants de personnes ni de contenu de dossier dans les adresses suivies ou les événements de mesure. Les dossiers métier ne sont pas destinés à la publicité.",
    ] },
    { id: "conservation", title: "Combien de temps les informations sont-elles conservées ?", paragraphs: [
      "La durée dépend de la catégorie de données, de l’usage du dossier et des obligations légales ou institutionnelles applicables. Les informations devenues inutiles doivent être supprimées, anonymisées ou archivées avec un accès restreint, selon la procédure définie par le CNAC.",
      "La fin d’une habilitation doit entraîner la fermeture de l’accès de l’utilisateur. Elle n’impose pas nécessairement la suppression immédiate des dossiers et traces utiles à la justification des opérations. Les durées exactes et les procédures d’archivage devront être précisées par le CNAC ; aucune durée unique ne s’applique à toutes les fiches.",
    ] },
    { id: "securite", title: "Comment contribuer à la protection des informations ?", paragraphs: [
      "Chaque utilisateur doit protéger ses identifiants, verrouiller son poste, se déconnecter après utilisation et employer les canaux autorisés par le CNAC. Les téléchargements, exports et copies doivent rester limités aux besoins de la mission et être stockés dans un environnement autorisé.",
      "Une erreur d’envoi, un document exposé, un accès inhabituel ou une perte d’équipement doit être signalé sans délai à l’administrateur CNAC. Aucun système ne peut garantir une sécurité absolue ; un incident nécessite une évaluation et les mesures d’information prévues par le droit applicable.",
    ] },
    { id: "droits", title: "Comment exercer vos droits ?", paragraphs: [
      "Vous pouvez demander au CNAC si des informations vous concernant sont traitées, en obtenir communication dans les conditions applicables et solliciter la correction d’une donnée inexacte. Selon la situation et le droit applicable, vous pouvez également demander un effacement, une limitation du traitement ou formuler une opposition.",
      "Adressez votre demande à l’administration du CNAC, directement ou par l’intermédiaire de votre administrateur habilité, en précisant votre identité, le dossier concerné et votre demande. Une vérification proportionnée de votre identité peut être nécessaire. Ne transmettez pas votre mot de passe ni un dossier médical par un canal non autorisé.",
      "Certains droits peuvent être limités par une obligation de conservation, les droits d’une autre personne ou une procédure légalement autorisée. Le CNAC doit expliquer le traitement donné à votre demande. Vous conservez les recours disponibles auprès des autorités compétentes.",
    ] },
    { id: "evolutions", title: "Évolution de cette politique", paragraphs: [
      "Cette version est proposée pour relecture par le CNAC. La politique devra être actualisée lorsque les fonctions, les destinataires ou les conditions de traitement changent. La version publiée et sa date permettent de repérer ces évolutions ; une modification importante doit être portée à la connaissance des personnes concernées.",
    ] },
  ],
}

export const termsDocument: LegalDocument = {
  kind: "conditions-utilisation",
  title: "Conditions d’utilisation",
  description: "Les règles communes pour utiliser la plateforme CNAC dans le cadre de vos fonctions, protéger les dossiers et travailler de manière responsable.",
  highlights: [
    { title: "Utilisateurs habilités", description: "Un espace de travail destiné au CNAC et à ses collaborateurs autorisés." },
    { title: "Usage professionnel", description: "Chaque consultation et modification doit répondre à une mission confiée." },
    { title: "Responsabilité partagée", description: "Des informations fiables, des accès protégés et une confidentialité respectée." },
  ],
  sections: [
    { id: "objet", title: "Objet et périmètre de la plateforme", paragraphs: [
      "La plateforme du Comité National Antidopage Congolais (CNAC) est un outil institutionnel de gestion et de coordination. Ces conditions encadrent son utilisation par le personnel du CNAC et les collaborateurs que le CNAC autorise expressément.",
      "L’accès à la plateforme ne constitue ni une inscription publique, ni un droit permanent sur les données. Une habilitation doit correspondre à une mission et aux fonctions effectivement ouvertes à l’utilisateur.",
    ] },
    { id: "acces", title: "Habilitations et compte utilisateur", paragraphs: [
      "Le CNAC organise l’attribution, la modification et le retrait des accès. Les utilisateurs doivent respecter les habilitations qui leur sont accordées, même lorsqu’une information est techniquement accessible. Ils signalent tout accès qui paraît dépasser leurs fonctions.",
      "Lorsqu’un compte individuel est attribué, il doit être utilisé exclusivement par son titulaire. Le partage de mot de passe, l’utilisation du compte d’un tiers et la transmission d’un accès à une personne non habilitée sont interdits. Un accès provisoire reste limité à la personne autorisée et ne vaut pas autorisation de le redistribuer.",
    ] },
    { id: "usage", title: "Usages autorisés", paragraphs: [
      "L’utilisateur peut consulter, créer ou modifier les informations nécessaires à sa mission, dans la limite de ses droits et des procédures du CNAC. Il doit vérifier les données avant leur enregistrement et utiliser uniquement les justificatifs pertinents.",
    ], items: [
      "Tenir à jour les fiches des athlètes et des autres acteurs concernés.",
      "Suivre les affiliations et les structures sportives dans le périmètre confié.",
      "Utiliser les fonctions institutionnelles effectivement disponibles et autorisées.",
      "Transmettre les corrections et les difficultés au service compétent du CNAC.",
    ] },
    { id: "interdictions", title: "Usages interdits", paragraphs: ["Il est notamment interdit de :"], items: [
      "Consulter un dossier par curiosité ou pour un intérêt privé sans rapport avec la mission.",
      "Publier, revendre ou transmettre des données à une personne non autorisée.",
      "Saisir de fausses informations, usurper une identité ou modifier un dossier pour dissimuler une opération.",
      "Contourner les restrictions, tester des accès sans autorisation ou perturber le service.",
      "Importer un fichier malveillant, un contenu illicite ou une pièce sans lien avec le dossier.",
      "Extraire massivement les informations ou les utiliser dans un service externe sans autorisation du CNAC.",
    ] },
    { id: "confidentialite", title: "Confidentialité et pièces sensibles", paragraphs: [
      "Les informations consultées dans l’exercice des fonctions doivent rester confidentielles, y compris après la fin de l’habilitation. Les copies, captures d’écran, impressions et exports sont soumis aux mêmes règles que les informations affichées dans la plateforme.",
      "Les pièces d’identité et les informations relatives aux mineurs exigent une attention particulière. Les observations générales ne doivent pas contenir de dossier médical, de diagnostic ou de résultat antidopage. Les données sensibles ne doivent être traitées que dans une procédure et un espace autorisés.",
      "La politique de confidentialité précise les catégories d’informations, leurs usages et les modalités de demande relatives aux données personnelles.",
    ] },
    { id: "qualite", title: "Exactitude et correction des dossiers", paragraphs: [
      "Avant une création ou une modification, l’utilisateur vérifie l’identité, les références et les liens d’affiliation. Il évite les doublons, conserve les justificatifs nécessaires et ne supprime pas une information uniquement pour contourner un désaccord ou une obligation de conservation.",
      "Une erreur doit être signalée et corrigée selon les procédures du CNAC. Si une correction nécessite un droit supplémentaire, l’utilisateur s’adresse à son administrateur plutôt que d’utiliser le compte d’un autre utilisateur.",
    ] },
    { id: "fonctionnalites", title: "Fonctions disponibles et portée des informations", paragraphs: [
      "La disponibilité d’un menu ne signifie pas que toutes ses fonctions sont ouvertes. Les rubriques Contrôles, AUT et Localisation annoncées comme à venir ne permettent pas encore d’accomplir une procédure antidopage complète.",
      "L’enregistrement d’une fiche, d’un statut ou d’une affiliation ne remplace pas une décision officielle, une notification réglementaire, une autorisation thérapeutique ou un résultat de contrôle. Les décisions et communications restent soumises aux procédures des autorités compétentes.",
    ] },
    { id: "incident", title: "Sécurité et signalement d’un incident", paragraphs: [
      "L’utilisateur protège ses identifiants, utilise un équipement autorisé et se déconnecte lorsqu’il quitte son poste. Il ne communique jamais son mot de passe à un interlocuteur qui le demande par email, téléphone ou messagerie.",
      "En cas d’accès suspect, de perte d’équipement, d’erreur de destinataire ou d’exposition d’un document, il informe immédiatement l’administrateur CNAC. Il conserve les éléments utiles au signalement et évite de diffuser à nouveau les données concernées.",
    ] },
    { id: "disponibilite", title: "Disponibilité et assistance", paragraphs: [
      "Le service peut être temporairement indisponible pour une maintenance, une mise à jour ou un incident technique. Une disponibilité permanente ou l’absence de toute erreur ne peut être garantie.",
      "Pour une opération urgente, l’utilisateur suit les procédures alternatives du CNAC et ne considère pas l’indisponibilité de l’application comme une dispense de ses obligations. Les demandes d’assistance sont adressées à l’administrateur ou au service désigné par le CNAC.",
    ] },
    { id: "suspension", title: "Fin ou suspension de l’accès", paragraphs: [
      "Le CNAC peut adapter, suspendre ou retirer une habilitation lorsque la mission prend fin, qu’un risque de sécurité apparaît ou qu’un usage contraire aux règles est constaté. Les circonstances et les suites sont examinées selon les procédures applicables.",
      "La fermeture d’un compte ne permet pas de conserver des copies personnelles des dossiers. L’utilisateur restitue ou supprime les copies selon les instructions du CNAC, sous réserve des obligations de conservation applicables.",
    ] },
    { id: "cadre", title: "Cadre applicable et règlement des difficultés", paragraphs: [
      "L’utilisation doit respecter le droit applicable en République démocratique du Congo, les procédures internes du CNAC et, pour les activités concernées, les règles antidopage applicables. Ces conditions ne remplacent pas ces textes et ne limitent pas les droits que la loi garantit aux personnes.",
      "Toute difficulté est d’abord signalée au service compétent du CNAC afin de rechercher une solution. Cette démarche n’exclut pas les recours prévus par le droit applicable ni la saisine d’une autorité compétente.",
    ] },
    { id: "version", title: "Information et mise à jour des conditions", paragraphs: [
      "Cette version est proposée pour relecture par le CNAC. Les utilisateurs doivent prendre connaissance des règles communiquées avant d’utiliser les fonctions mises à leur disposition. Les modalités de remise ou d’acceptation de ces conditions seront définies dans le parcours d’accès institutionnel.",
      "Les évolutions importantes doivent être communiquées aux utilisateurs. La simple consultation de cette page ne constitue pas un enregistrement d’acceptation et ne remplace pas un consentement spécifique lorsqu’il est requis pour un traitement de données.",
    ] },
  ],
}
