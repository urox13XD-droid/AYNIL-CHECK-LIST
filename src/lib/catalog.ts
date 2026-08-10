export type EquipCategory =
  | "camera"
  | "lens"
  | "video-tx"
  | "video-rx"
  | "audio-hf"
  | "monitor"
  | "recorder"
  | "distributor"
  | "support"
  | "power"
  | "media"
  | "other";

export const CATEGORY_LABELS: Record<EquipCategory, string> = {
  camera: "Caméra",
  lens: "Optique",
  "video-tx": "HF Vidéo — Émetteur",
  "video-rx": "HF Vidéo — Récepteur",
  "audio-hf": "HF Audio",
  monitor: "Moniteur",
  recorder: "Enregistreur",
  distributor: "Distributeur / Switch",
  support: "Support / Stabilisation",
  power: "Alimentation",
  media: "Média / Stockage",
  other: "Autre",
};

export const CATEGORY_ORDER: EquipCategory[] = [
  "camera",
  "lens",
  "video-tx",
  "video-rx",
  "audio-hf",
  "monitor",
  "recorder",
  "distributor",
  "support",
  "power",
  "media",
  "other",
];

export const DEFAULT_ROLES = [
  "1er assistant caméra",
  "2e assistant caméra",
  "3e assistant caméra / vidéo",
  "Assistant vidéo / HF",
  "DIT",
  "Chef opérateur",
  "Ingénieur du son",
  "Régie",
];

export const DEFAULT_ROLE_BY_CATEGORY: Record<EquipCategory, string> = {
  camera: "1er assistant caméra",
  lens: "1er assistant caméra",
  "video-tx": "Assistant vidéo / HF",
  "video-rx": "Assistant vidéo / HF",
  "audio-hf": "Ingénieur du son",
  monitor: "2e assistant caméra",
  recorder: "DIT",
  distributor: "Assistant vidéo / HF",
  support: "1er assistant caméra",
  power: "2e assistant caméra",
  media: "DIT",
  other: "2e assistant caméra",
};

export const CATEGORY_BASE_ITEMS: Record<EquipCategory, string[]> = {
  camera: [
    "Vérifier / mettre à jour la version du firmware",
    "Régler la date et l'heure",
    "Formater les médias",
    "Vérifier le jam de timecode avec le reste de la chaîne",
    "Vérifier le montage de l'objectif et le tirage (backfocus)",
    "Vérifier les ND / filtres intégrés",
    "Régler la balance des blancs et les paramètres colorimétriques (ASA, gamma, look)",
    "Vérifier l'état des batteries et l'autonomie",
  ],
  lens: [
    "Vérifier l'état optique (rayures, poussière, humidité)",
    "Vérifier la fluidité des bagues et le point de bascule",
    "Vérifier la correspondance de monture avec le corps caméra",
    "Vérifier les repères de mise au point / calibration follow focus",
  ],
  "video-tx": [
    "Scanner les fréquences / canaux disponibles sur le lieu",
    "Appairer avec le(s) récepteur(s)",
    "Vérifier le niveau de batterie et l'autonomie",
    "Vérifier la fixation de l'antenne et la ventilation",
  ],
  "video-rx": [
    "Vérifier l'appairage avec le(s) émetteur(s)",
    "Vérifier la qualité de réception (latence, coupures) à distance de tournage réelle",
    "Vérifier la sortie vers le distributeur / moniteur",
    "Vérifier l'alimentation et le niveau de batterie",
  ],
  "audio-hf": [
    "Scanner les fréquences disponibles et vérifier les interférences",
    "Vérifier le niveau de batterie et prévoir les rechanges",
    "Vérifier l'appairage émetteur/récepteur et le gain d'entrée",
  ],
  monitor: [
    "Vérifier le calibrage / la luminosité pour un usage extérieur",
    "Charger le LUT / la calibration colorimétrique du projet",
    "Vérifier la source d'entrée et les overlays (marqueurs, cadre, faux-ronds)",
    "Vérifier l'alimentation et les câbles",
  ],
  recorder: [
    "Vérifier que le média est inséré et formaté",
    "Vérifier le format / codec d'enregistrement paramétré",
    "Vérifier le jam de timecode",
    "Vérifier l'espace disponible suffisant pour la journée",
  ],
  distributor: [
    "Vérifier toutes les entrées/sorties utilisées",
    "Vérifier l'alimentation et prévoir un câble de secours",
    "Vérifier qu'aucune boucle / conflit de signal n'existe",
  ],
  support: [
    "Vérifier l'équilibrage une fois la caméra montée",
    "Vérifier l'état des batteries si support motorisé",
    "Vérifier la fixation et le serrage de tous les points de sécurité",
  ],
  power: [
    "Vérifier le nombre de batteries chargées disponibles",
    "Vérifier les chargeurs et câbles secteur",
    "Prévoir un plan de charge pour la journée",
  ],
  media: [
    "Formater et vérifier chaque support avant la journée",
    "Vérifier la vitesse d'écriture compatible avec le format choisi",
    "Prévoir un plan de sauvegarde / backup sur le tournage",
  ],
  other: [
    "Vérifier l'état général et le bon fonctionnement",
    "Vérifier les câbles et accessoires associés",
  ],
};

/** Points communs à cocher quel que soit le matériel, dès qu'une liste est analysée. */
export const GENERAL_ITEMS: string[] = [
  "Vérifier la synchronisation timecode sur toute la chaîne (caméra ↔ enregistreurs ↔ son)",
  "Vérifier les talkies / communication plateau",
  "Vérifier les caisses de transport et mousses",
  "Vérifier le jeu de câbles de secours (SDI, alimentation, HF)",
  "Vérifier l'accès aux prises secteur / groupe électrogène sur le plateau",
  "Vérifier le plan de tournage du lendemain et les besoins spécifiques",
];

export interface EquipRule {
  id: string;
  label: string;
  category: EquipCategory;
  /** sous-chaînes en minuscules recherchées dans la ligne importée */
  keywords: string[];
  /** points de check-list additionnels, propres à ce modèle */
  items?: string[];
}

export const EQUIP_CATALOG: EquipRule[] = [
  // Caméras
  { id: "alexa35", label: "ARRI Alexa 35", category: "camera", keywords: ["alexa 35", "alexa35"] },
  { id: "alexa-mini-lf", label: "ARRI Alexa Mini LF", category: "camera", keywords: ["alexa mini lf", "aminilf"] },
  { id: "alexa-mini", label: "ARRI Alexa Mini", category: "camera", keywords: ["alexa mini"] },
  { id: "venice2", label: "Sony VENICE 2", category: "camera", keywords: ["venice 2", "venice2"] },
  { id: "venice", label: "Sony VENICE", category: "camera", keywords: ["venice"] },
  { id: "red-raptor", label: "RED V-Raptor", category: "camera", keywords: ["v-raptor", "raptor"] },
  { id: "red-komodo", label: "RED Komodo", category: "camera", keywords: ["komodo"] },
  { id: "fx6", label: "Sony FX6", category: "camera", keywords: ["fx6"] },
  { id: "fx9", label: "Sony FX9", category: "camera", keywords: ["fx9"] },

  // HF Vidéo
  {
    id: "bolt6-tx",
    label: "Teradek Bolt 6 TX",
    category: "video-tx",
    keywords: ["bolt 6 tx", "bolt6 tx"],
    items: ["Vérifier la limite de fan-out (nombre de récepteurs simultanés)"],
  },
  { id: "bolt6-rx", label: "Teradek Bolt 6 RX", category: "video-rx", keywords: ["bolt 6 rx", "bolt6 rx"] },
  { id: "bolt4k-tx", label: "Teradek Bolt 4K TX", category: "video-tx", keywords: ["bolt 4k tx", "bolt4k tx"] },
  { id: "bolt4k-rx", label: "Teradek Bolt 4K RX", category: "video-rx", keywords: ["bolt 4k rx", "bolt4k rx"] },
  { id: "bolt3000-tx", label: "Teradek Bolt 3000 TX", category: "video-tx", keywords: ["bolt 3000 tx", "bolt3000 tx"] },
  { id: "bolt3000-rx", label: "Teradek Bolt 3000 RX", category: "video-rx", keywords: ["bolt 3000 rx", "bolt3000 rx"] },
  { id: "bolt3000-xt", label: "Teradek Bolt 3000 XT", category: "video-tx", keywords: ["bolt 3000 xt", "bolt3000 xt"] },
  { id: "bolt-sidekick", label: "Teradek Bolt Sidekick", category: "video-rx", keywords: ["sidekick"] },
  {
    id: "servpro4k",
    label: "Teradek Serv Pro 4K",
    category: "video-tx",
    keywords: ["serv pro 4k"],
    items: ["Vérifier la connexion au moniteur de contrôle réalisateur (app Serv Pro / QTAKE)"],
  },
  {
    id: "servpro",
    label: "Teradek Serv Pro",
    category: "video-tx",
    keywords: ["serv pro"],
    items: ["Vérifier la connexion au moniteur de contrôle réalisateur (app Serv Pro / QTAKE)"],
  },
  { id: "teradek-link", label: "Teradek Link", category: "distributor", keywords: ["teradek link"] },
  { id: "vaxis-storm-tx", label: "Vaxis Storm 3000 TX", category: "video-tx", keywords: ["storm 3000 tx", "vaxis storm tx"] },
  { id: "vaxis-storm-rx", label: "Vaxis Storm 3000 RX", category: "video-rx", keywords: ["storm 3000 rx", "vaxis storm rx"] },
  { id: "dwarf-tx", label: "Vaxis Dwarf TX", category: "video-tx", keywords: ["dwarf"] },
  { id: "cvw-tx", label: "CVW PRO 800 TX", category: "video-tx", keywords: ["cvw pro 800 tx", "cvw tx"] },
  { id: "cvw-rx", label: "CVW PRO 800 RX", category: "video-rx", keywords: ["cvw pro 800 rx", "cvw rx"] },
  { id: "hollyland", label: "Hollyland", category: "video-tx", keywords: ["hollyland"] },
  { id: "accsoon", label: "Accsoon", category: "video-tx", keywords: ["accsoon"] },
  { id: "antenna-array", label: "Antenne Array", category: "video-rx", keywords: ["antenne array", "antenna array"] },

  // Moniteurs
  { id: "smallhd-ultra5", label: "SmallHD Ultra 5", category: "monitor", keywords: ["ultra 5", "ultra5"] },
  { id: "smallhd-cine7", label: "SmallHD Cine 7", category: "monitor", keywords: ["cine 7", "cine7"] },
  { id: "smallhd-503", label: "SmallHD 503", category: "monitor", keywords: ["smallhd 503", "503"] },
  { id: "smallhd-13", label: "SmallHD 13\"", category: "monitor", keywords: ["smallhd 13"] },
  { id: "smallhd-18", label: "SmallHD 18\"", category: "monitor", keywords: ["smallhd 18"] },
  { id: "smallhd-24", label: "SmallHD 24\"", category: "monitor", keywords: ["smallhd 24"] },
  { id: "tvlogic-075", label: "TVLogic 7.5\"", category: "monitor", keywords: ["tvlogic 07", "tvlogic 7.5"] },
  { id: "tvlogic-095", label: "TVLogic 9.5\"", category: "monitor", keywords: ["tvlogic 09", "tvlogic 9.5"] },
  { id: "tvlogic-17", label: "TVLogic 17\"", category: "monitor", keywords: ["tvlogic 17"] },
  { id: "sony-pvm", label: "Sony PVM", category: "monitor", keywords: ["pvm"] },
  { id: "sony-lmd", label: "Sony LMD", category: "monitor", keywords: ["lmd"] },
  { id: "btlh910", label: "BTLH 910", category: "monitor", keywords: ["btlh"] },
  {
    id: "ipad",
    label: "iPad (retour réal / Qtake)",
    category: "monitor",
    keywords: ["ipad"],
    items: [
      "Vérifier l'app installée et à jour (QTake, Movie Slate…)",
      "Vérifier la connexion Wi-Fi / réseau plateau",
    ],
  },

  // Enregistrement / distribution
  {
    id: "qtake",
    label: "Ovide Qtake",
    category: "other",
    keywords: ["qtake"],
    items: ["Vérifier la licence et la config du projet (résolution, LUT, métadonnées)"],
  },
  { id: "pix-e5", label: "Sound Devices PIX-E5", category: "recorder", keywords: ["pix-e5", "pix e5"] },
  { id: "switch-sdi", label: "Switch SDI", category: "distributor", keywords: ["switch sdi"] },
  { id: "decimator", label: "Decimator", category: "distributor", keywords: ["decimator"] },

  // Support / motorisation
  { id: "arri-wcu", label: "ARRI WCU / hand unit", category: "support", keywords: ["wcu", "hand unit"] },
  { id: "arri-wr1", label: "ARRI WR1", category: "support", keywords: ["wr1"] },
  { id: "arri-wt1", label: "ARRI WT1", category: "support", keywords: ["wt1"] },
  { id: "preston-fiz", label: "Preston FI+Z", category: "support", keywords: ["preston", "fi+z", "fiz"] },
  { id: "cmotion", label: "cmotion", category: "support", keywords: ["cmotion"] },
  { id: "easyrig", label: "Easyrig", category: "support", keywords: ["easyrig"] },
  { id: "stabilizer", label: "Stabilisateur (Movi / Ronin)", category: "support", keywords: ["movi", "ronin"] },
];

/**
 * Un mot-clé ne compte que s'il apparaît en tête de ligne (juste après la
 * quantité, éventuellement précédé d'une courte marque/article). Ça évite
 * qu'une ligne d'accessoire qui *mentionne* un appareil en passant («kit
 * énergie Sony Venice 290 Wh», «câble alim moteur RF sur Venice») ne soit
 * comptée comme un exemplaire de plus de cet appareil.
 */
const MAX_KEYWORD_LEAD_CHARS = 14;

function isWordChar(ch: string | undefined): boolean {
  return !!ch && /[a-z0-9à-ÿ]/i.test(ch);
}

function leadingKeywordIndex(text: string, keyword: string): number {
  let from = 0;
  for (;;) {
    const idx = text.indexOf(keyword, from);
    if (idx === -1) return -1;
    const before = idx === 0 ? undefined : text[idx - 1];
    const after = text[idx + keyword.length];
    if (!isWordChar(before) && !isWordChar(after)) return idx;
    from = idx + 1;
  }
}

export function matchRule(normalizedLine: string): EquipRule | null {
  let best: EquipRule | null = null;
  let bestLen = 0;
  for (const rule of EQUIP_CATALOG) {
    for (const kw of rule.keywords) {
      const idx = leadingKeywordIndex(normalizedLine, kw);
      if (idx !== -1 && idx <= MAX_KEYWORD_LEAD_CHARS && kw.length > bestLen) {
        best = rule;
        bestLen = kw.length;
      }
    }
  }
  return best;
}

/**
 * Matériel de fixation, câblage et consommables : ce n'est pas ce qu'on
 * vérifie à l'essai caméra (le point est déjà couvert par la check-list de
 * l'appareil principal), donc ces lignes sont ignorées par défaut plutôt que
 * de noyer la liste « non reconnu » que l'utilisateur doit trier à la main.
 */
export const IGNORE_KEYWORDS: string[] = [
  // fixations / plaques
  "top plate", "plate", "bridge plate", "top handle", "shoulder adapter",
  "plaque", "adaptateur hot swap", "adaptateur", "platine", "spigot", "qrp",
  // câblage
  "câble", "cable", "câbles tissus", "cables tissus", "rallonge", "vipère",
  "d-tap", "touret", "multiprise", "convertisseur", "répartiteur",
  // habillage caméra / accessoires légers
  "cage", "shade", "bras magique", "tige", "poignée", "poignées", "bague",
  "tiroir", "clip on", "housse", "sacoche",
  // machinerie / roulantes (hors périmètre essai caméra)
  "tête fluide", "head lock", "head_lock", "branche", "pied à roulettes",
  "roulante", "hub usb",
];

export function isAccessoryLine(normalizedLine: string): boolean {
  return IGNORE_KEYWORDS.some((kw) => {
    const idx = leadingKeywordIndex(normalizedLine, kw);
    return idx !== -1 && idx <= MAX_KEYWORD_LEAD_CHARS;
  });
}
