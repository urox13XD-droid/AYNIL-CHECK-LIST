import { ChecklistItemState, ChecklistSection } from "./storage";

/** "1" / "2" / "3" as used throughout the master checklist source document */
export const MASTER_ROLE_NAMES: Record<string, string> = {
  "1": "1er assistant caméra",
  "2": "2e assistant caméra",
  "3": "3e assistant caméra / vidéo",
};

/** label, then role codes ("1", "2,3", ...) — empty string when the source left the role blank */
type RawItem = [string, string];

interface RawSection {
  title: string;
  items: RawItem[];
}

const SECTIONS: RawSection[] = [
  {
    title: "Réception du matériel",
    items: [
      ["Vérifier que toute la liste est présente sur le banc", "2,3"],
      ["Comparer avec la liste caméra du chef opérateur", "1"],
      ["Vérifier l'état général de chaque élément", "2,3"],
      ["Vérifier les fiches d'état du loueur", "2,3"],
      ["Photographier tous les défauts existants", "1,2,3"],
      ["Préparer les consommables", "2"],
      ["Préparer tous les spares", "2,3"],
    ],
  },
  {
    title: "Caméra — Capteur",
    items: [
      ["Contrôle visuel", "1"],
      ["Recherche de poussières", "1"],
      ["Vérification pixels morts (noir + blanc)", "1"],
      ["Test diaphragme fermé / ISO élevé", "1"],
      ["Passage à la boîte à lumière", "1,2"],
      ["Vérification colorimétrique", "1,2"],
      ["Nettoyage du capteur si nécessaire", "1"],
      ["Vérifier la monture", "1"],
      ["Vérifier le ventilateur (bruit)", "1"],
    ],
  },
  {
    title: "Caméra — Menus",
    items: [
      ["Firmware", "1"],
      ["Reset caméra si nécessaire", "1"],
      ["Résolution", "1"],
      ["Codec", "1"],
      ["FPS", "1"],
      ["Shutter", "1"],
      ["Color Space", "1"],
      ["Format capteur", "1"],
      ["LUT", "1,2"],
      ["Framelines", "1,2"],
      ["Overlay", "1"],
      ["Timecode", "1"],
      ["WiFi", "1,2"],
      ["Boutons User", "1"],
      ["Réglage ventilateur", "1"],
      ["SDI Flag / Auto REC", "1,3"],
      ["Alertes batterie", "1"],
      ["Sauvegarde du setup", "1,2"],
    ],
  },
  {
    title: "Caméra — Fonctionnement",
    items: [
      ["Vérifier tous les boutons", "1,3"],
      ["Vérifier REC", "1,2"],
      ["Vérifier toutes les sorties SDI", "1,3"],
      ["Vérifier compatibilité sorties SDI avec tous les HF", "3"],
      ["Vérifier REC Trigger enregistreur", "3"],
      ["Vérifier Hot Swap batteries", "1,2"],
      ["Vérifier antenne", "3"],
      ["Identifier chaque caméra (A/B/C) et lui donner une couleur", "2"],
      [
        "Reporter cette couleur sur : commandes HF, accessoires, pieds, plan film, caisses",
        "2",
      ],
    ],
  },
  {
    title: "Viseur",
    items: [
      ["Nettoyage", "1"],
      ["Dioptrie", "1"],
      ["Luminosité", "1"],
      ["Colorimétrie", "1"],
      ["Overlay", ""],
      ["Conformité cadre", "1,2"],
      ["Vérification côte caméra", "1"],
      ["Comparaison avec viseur de champ", "2"],
    ],
  },
  {
    title: "Objectifs — État",
    items: [
      [
        "État des optiques : frontales, lentilles arrière, rayures, champignons, carrossage, fluidité des bagues, jeu mécanique — photographier tous les défauts",
        "2",
      ],
    ],
  },
  {
    title: "Objectifs — Calage",
    items: [
      ["Infini", "1"],
      ["Zoom ramping / linéarité", "1"],
      ["Pompage", "1"],
      ["Définition", "1"],
      ["Flare", "1"],
    ],
  },
  {
    title: "Objectifs — Compatibilité",
    items: [
      ["Doubleur", "1,2"],
      ["Extender", "1,2"],
      ["Support optique", "2"],
    ],
  },
  {
    title: "Mattebox",
    items: [
      ["État général", "2"],
      ["Tous les bons dos", "2"],
      ["Tous les tiroirs", "2"],
      ["Tous les volets", "2"],
      ["Tiroir Dioptries ou Diopter stage", "2"],
      ["Test de tous les tiroirs", "2"],
      ["Vérifier ressorts porte-filtres", "2"],
      ["Vignettage caches", "2"],
      ["Vignettage courtes focales + Pola", "1,2"],
      ["Velcro côté matte box - TAG filtre", "2"],
    ],
  },
  {
    title: "Mattebox — Cinetape",
    items: [
      ["Test distance max", "1"],
      ["Câblage spare LCUBE", "1,2"],
    ],
  },
  {
    title: "Filtres",
    items: [
      ["État des lieux", "2"],
      ["Identification", "2"],
      ["TAG filtre", ""],
      ["Colorimétrie table lumineuse", "2"],
      ["Clear supplémentaires", "2"],
      ["Nettoyer tous les filtres", "2"],
    ],
  },
  {
    title: "Follow Focus / HF — Moteurs",
    items: [
      ["Identifier chaque moteur", "1"],
      ["Tester chaque moteur", "1"],
      ["Couple", "1"],
      ["Direction", "1"],
      ["Tester avec toutes les configurations", "1"],
    ],
  },
  {
    title: "Follow Focus / HF — Commandes",
    items: [
      ["Appairage", "1"],
      ["Portée", "1"],
      ["REC Trigger", "1"],
      ["LDA", "1"],
      ["Sauvegarde LDA", "1,2"],
      ["Graver les bagues de diaph", "2"],
      ["Compatibilité bagues", "2"],
      ["Zoom motorisé", "1"],
      ["Faire les flèches de point", "1,2"],
    ],
  },
  {
    title: "Configurations caméra",
    items: [
      ["Branche", "2"],
      ["Épaule", "1,2"],
      ["EasyRig", "1,2"],
      ["Steadicam", "1"],
      ["Ronin", "1,2"],
      ["Voiture", "1,2"],
      ["Configuration légère", "1,2"],
      ["Photographier chaque configuration", "2"],
      ["Mesurer hauteur mini", "2"],
      ["Mesurer hauteur maxi", "2"],
      ["Peser configuration mini", "2"],
      ["Peser configuration maxi", "2"],
    ],
  },
  {
    title: "Vidéo — Moniteurs",
    items: [
      ["État des lieux", "3"],
      ["Backlight", "3"],
      ["Étalonnage", "3"],
      ["Comparaison avec caméra", "3"],
      ["Tous allumés simultanément", "3"],
      ["Noter les réglages", "3"],
      ["Vérifier impacts", "3"],
      ["Fabriquer caches écrans", "3"],
    ],
  },
  {
    title: "Vidéo — SDI",
    items: [
      ["Tester toutes les BNC et touret", "3"],
      ["Tester tous les câbles vidéo", "3"],
    ],
  },
  {
    title: "Vidéo — HF",
    items: [
      ["Appairer tous les HF vidéo", "3"],
      ["Tester qualité image et portée", "3"],
      ["Tester latence", "3"],
      ["Vérifier affichage sur tous les écrans", "3"],
      ["Appairer Serv Pro et Link", "3"],
    ],
  },
  {
    title: "Vidéo — Enregistreur",
    items: [
      ["REC Trigger", "3"],
      ["Lecture Pix", "3"],
      ["Vérif SSD", "3"],
      ["Codec", "3"],
      ["Menu enregistreur", "3"],
      ["Arborescence PIX", "3"],
    ],
  },
  {
    title: "Vidéo — Configurations",
    items: [
      ["Roulante vidéo / Combo", "3"],
      ["Kit Réal", "3"],
      ["Roulante / Moniteur chef opérateur", "3"],
      ["Moniteur focus", "3"],
      ["Déport HF Teradek", "3"],
    ],
  },
  {
    title: "Data",
    items: [
      ["Identifier toutes les cartes", "2"],
      ["Nommer les cartes", "2"],
      ["Nommer physiquement disques et navettes", "2"],
      ["Formater cartes", "2"],
      ["Formater navettes", "2"],
      ["Formater tour RAID", "2"],
      ["Tester enregistrement et backup de chaque carte complète", "2"],
      ["Copier simultanément sur navette + RAID", "2"],
      ["Utiliser exactement les câbles du tournage", "2"],
      ["Chronométrer le backup", "2"],
      ["Noter poids des fichiers", "2"],
      ["Noter débit", "2"],
      ["Configurer logiciel backup", "2"],
      ["Tester lecteur cartes", "2"],
      ["Préparer workflow labo", "2"],
      ["Préparer boucle mail", "2"],
      ["Préparer rapports caméra", "2"],
      ["Prévoir tous les spares backup", "2"],
    ],
  },
  {
    title: "Batteries",
    items: [
      ["Compter toutes les batteries", "3"],
      ["Identifier chaque batterie", "3"],
      ["Charger", "3"],
      ["Tester autonomie", "3"],
      ["Tester D-Tap", "3"],
      ["Tester USB", "3"],
      ["Tester chargeurs", "3"],
      ["Préparer flight case / sac batteries", "3"],
      ["Préparer roulante batteries chargeurs", "3"],
    ],
  },
  {
    title: "Câblage (spares)",
    items: [
      ["BNC", "3"],
      ["LBUS", "2"],
      ["Lemo", "2,3"],
      ["D-Tap", "3"],
      ["XLR4", "3"],
      ["Cinetape", "1,2"],
      ["Teradek", "3"],
      ["Pix", "3"],
      ["Chargeurs", "3"],
    ],
  },
  {
    title: "Accessoires",
    items: [
      ["Baseplates", "1"],
      ["Épaulière", "1"],
      ["Poignées", "2"],
      ["Master Grip", "2"],
      ["Tiges 15", "1,2"],
      ["Tiges 19", "1,2"],
      ["Bras magique", "1,2"],
      ["Support écran", "3"],
      ["Accroche Pix", "3"],
    ],
  },
  {
    title: "Machinerie",
    items: [
      ["Support QRP", "2"],
      ["Freins roulantes", "2"],
      ["Roues", "2"],
      ["Pression pneus", "2"],
      ["Vérifier tous les serrages", "2"],
    ],
  },
  {
    title: "Protection",
    items: [
      ["Housses pluie caméra", "2"],
      ["Housses pluie écrans", "3"],
      ["Housses pluie commandes", "1,2"],
      ["Élingue de sécurité LMB5", "2"],
      ["Prévoir cercueil/berceau caméra", "2"],
      ["Prévoir caisses optiques vides / baladeuse", "2"],
    ],
  },
  {
    title: "Organisation",
    items: [
      ["Organiser les sacs accessoires", "2"],
      ["Organiser les sacs batteries", "3"],
      ["Organiser les sacs vidéo", "3"],
      ["Organiser les caisses fournitures", "2"],
      ["Lister le contenu des caisses", "2"],
      ["Identifier toutes les caisses", "2"],
      ["Étiquetage production", "2,3"],
      ["Organiser la roulante caméra", "2"],
      ["Organiser la roulante vidéo", "3"],
      ["Organiser les étagères camion", "2"],
      ["Mesurer les roulantes", "2"],
      ["Plan camion", "2"],
      ["Heure de chargement", "2"],
      ["Vérifier le PDT", "2"],
      ["Prévoir retours location", "2"],
      ["Créer dossier Drive (casse, échanges, A/R matériel, photos)", "2"],
      ["Faire liste électro", "2"],
      ["Faire liste machino", "2"],
    ],
  },
];

function makeItem(rawLabel: string, roleCodes: string): ChecklistItemState {
  const codes = roleCodes ? roleCodes.split(",") : [];
  const role = codes.length > 0 ? MASTER_ROLE_NAMES[codes[0]] : "";
  return { id: `item_${Math.random().toString(36).slice(2, 9)}`, label: rawLabel, checked: false, role };
}

/** The full "MASTER CHECKLIST ESSAIS CAMÉRA" template, independent of any specific equipment list. */
export function buildMasterChecklist(): ChecklistSection[] {
  return SECTIONS.map((section, i) => ({
    id: `sec_master_${i}`,
    title: section.title,
    quantity: 1,
    items: section.items.map(([label, roles]) => makeItem(label, roles)),
  }));
}
