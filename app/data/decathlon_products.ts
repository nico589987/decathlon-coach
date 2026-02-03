export type Product = {
  id: string;
  name: string;
  price: string;
  image: string | null;
  categoryKey: string;
  categoryLabel: string;
  badge: string;
  description: string;
};

export const products: Product[] = [
    {
        "id":  "8956115",
        "name":  "Kiprun KD900X.2 â€“ Carbon Plate (Green)",
        "price":  "129,99 \\u20AC",
        "image":  "/products/8956115.jpg",
        "categoryKey":  "running shoes",
        "categoryLabel":  "Chaussures",
        "badge":  "Avanc\\u00E9",
        "description":  "High-performance road running shoe with carbon plate for fast training and races."
    },
    {
        "id":  "8873070",
        "name":  "Kiprun Cushion 500 (Grey)",
        "price":  "48,99 \\u20AC",
        "image":  "/products/8873070.jpg",
        "categoryKey":  "running shoes",
        "categoryLabel":  "Chaussures",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Comfortable cushioned shoe for regular road running, 2â€“3 times per week."
    },
    {
        "id":  "8757335",
        "name":  "Jogflow 190.1 Run (Black)",
        "price":  "27,99 \\u20AC",
        "image":  "/products/8757335.jpg",
        "categoryKey":  "running shoes",
        "categoryLabel":  "Chaussures",
        "badge":  "D\\u00E9butant",
        "description":  "Entry-level flexible running shoe for occasional short-distance runs."
    },
    {
        "id":  "8296178",
        "name":  "Run 100 Low Running Socks",
        "price":  "3,99 \\u20AC",
        "image":  "/products/8296178.jpg",
        "categoryKey":  "socks",
        "categoryLabel":  "Chaussettes",
        "badge":  "D\\u00E9butant",
        "description":  "Basic breathable low-cut socks for short runs in mild weather."
    },
    {
        "id":  "8810971",
        "name":  "Run 500 Mid Running Socks",
        "price":  "6,99 \\u20AC",
        "image":  "/products/8810971.jpg",
        "categoryKey":  "socks",
        "categoryLabel":  "Chaussettes",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Comfortable mid-height socks with anti-friction zones for regular running."
    },
    {
        "id":  "8810439",
        "name":  "Run Warm Running Socks",
        "price":  "7,99 \\u20AC",
        "image":  "/products/8810439.jpg",
        "categoryKey":  "socks",
        "categoryLabel":  "Chaussettes",
        "badge":  "Tous niveaux",
        "description":  "Warm running socks designed for cold-weather road runs."
    },
    {
        "id":  "run-ts-100",
        "name":  "Run Dry 100 Short-Sleeve T-Shirt",
        "price":  "6,99 \\u20AC",
        "image":  "/products/run-ts-100.jpg",
        "categoryKey":  "top",
        "categoryLabel":  "Hauts",
        "badge":  "D\\u00E9butant",
        "description":  "Lightweight, breathable running t-shirt for beginners in warm weather."
    },
    {
        "id":  "run-ts-500",
        "name":  "Run Dry 500 Breathable T-Shirt",
        "price":  "12,99 \\u20AC",
        "image":  "/products/run-ts-500.jpg",
        "categoryKey":  "top",
        "categoryLabel":  "Hauts",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Breathable quick-dry t-shirt for regular training."
    },
    {
        "id":  "run-ls-warm",
        "name":  "Run Warm Long-Sleeve Top",
        "price":  "14,99 \\u20AC",
        "image":  "/products/run-ls-warm.jpg",
        "categoryKey":  "top",
        "categoryLabel":  "Hauts",
        "badge":  "Tous niveaux",
        "description":  "Soft brushed long-sleeve top for staying warm on cold runs."
    },
    {
        "id":  "run-ls-zip",
        "name":  "Run Warm 1/2 Zip Top",
        "price":  "24,99 \\u20AC",
        "image":  "/products/run-ls-zip.jpg",
        "categoryKey":  "top",
        "categoryLabel":  "Hauts",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Half-zip thermal top for adjustable warmth on winter runs."
    },
    {
        "id":  "run-short-100",
        "name":  "Run Dry 100 Running Shorts",
        "price":  "7,99 \\u20AC",
        "image":  "/products/run-short-100.jpg",
        "categoryKey":  "shorts",
        "categoryLabel":  "Shorts",
        "badge":  "D\\u00E9butant",
        "description":  "Simple lightweight shorts for occasional running."
    },
    {
        "id":  "run-short-500",
        "name":  "Run Dry 500 2-in-1 Shorts",
        "price":  "17,99 \\u20AC",
        "image":  "/products/run-short-500.jpg",
        "categoryKey":  "shorts",
        "categoryLabel":  "Shorts",
        "badge":  "Interm\\u00E9diaire",
        "description":  "2-in-1 shorts with inner lining for comfort on regular runs."
    },
    {
        "id":  "run-tight-100",
        "name":  "Run Warm 100 Tights",
        "price":  "14,99 \\u20AC",
        "image":  "/products/run-tight-100.jpg",
        "categoryKey":  "tights",
        "categoryLabel":  "Collants",
        "badge":  "D\\u00E9butant",
        "description":  "Basic warm tights for running in cool to cold weather."
    },
    {
        "id":  "run-tight-500",
        "name":  "Run Support 500 Tights",
        "price":  "24,99 \\u20AC",
        "image":  "/products/run-tight-500.jpg",
        "categoryKey":  "tights",
        "categoryLabel":  "Collants",
        "badge":  "Avanc\\u00E9",
        "description":  "Supportive tights with pockets for longer cold-weather runs."
    },
    {
        "id":  "run-jkt-wind",
        "name":  "Run Wind Windproof Jacket",
        "price":  "24,99 \\u20AC",
        "image":  "/products/run-jkt-wind.jpg",
        "categoryKey":  "jacket",
        "categoryLabel":  "Vestes",
        "badge":  "Tous niveaux",
        "description":  "Ultra-light windproof jacket for protection in windy conditions."
    },
    {
        "id":  "run-jkt-rain",
        "name":  "Run Rain Waterproof Jacket",
        "price":  "39,99 \\u20AC",
        "image":  "/products/run-jkt-rain.jpg",
        "categoryKey":  "jacket",
        "categoryLabel":  "Vestes",
        "badge":  "Avanc\\u00E9",
        "description":  "Waterproof running jacket for rainy training sessions."
    },
    {
        "id":  "run-jkt-warm",
        "name":  "Run Warm Insulated Jacket",
        "price":  "39,99 \\u20AC",
        "image":  "/products/run-jkt-warm.jpg",
        "categoryKey":  "jacket",
        "categoryLabel":  "Vestes",
        "badge":  "Tous niveaux",
        "description":  "Insulated jacket for very cold conditions and low-intensity runs."
    },
    {
        "id":  "run-cap-100",
        "name":  "Run 100 Running Cap",
        "price":  "9,99 \\u20AC",
        "image":  "/products/run-cap-100.jpg",
        "categoryKey":  "cap",
        "categoryLabel":  "Casquettes",
        "badge":  "Tous niveaux",
        "description":  "Lightweight cap to protect from sun and keep sweat away."
    },
    {
        "id":  "run-cap-500",
        "name":  "Run Breathable Mesh Cap",
        "price":  "12,99 \\u20AC",
        "image":  "/products/run-cap-500.jpg",
        "categoryKey":  "cap",
        "categoryLabel":  "Casquettes",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Breathable cap with mesh panels for regular runners."
    },
    {
        "id":  "run-headband",
        "name":  "Run Warm Headband",
        "price":  "5,99 \\u20AC",
        "image":  "/products/run-headband.jpg",
        "categoryKey":  "headband",
        "categoryLabel":  "Bandeaux",
        "badge":  "Tous niveaux",
        "description":  "Warm headband covering ears while allowing heat to escape from the head."
    },
    {
        "id":  "run-gloves-100",
        "name":  "Run Warm 100 Gloves",
        "price":  "8,99 \\u20AC",
        "image":  null,
        "categoryKey":  "gloves",
        "categoryLabel":  "Gants",
        "badge":  "D\\u00E9butant",
        "description":  "Light warm gloves for cool-weather running."
    },
    {
        "id":  "run-gloves-500",
        "name":  "Run Warm 500 Touch Gloves",
        "price":  "12,99 \\u20AC",
        "image":  "/products/run-gloves-500.jpg",
        "categoryKey":  "gloves",
        "categoryLabel":  "Gants",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Warmer gloves with touch-screen compatibility for winter runs."
    },
    {
        "id":  "run-watch-w200",
        "name":  "W200 S Running Watch",
        "price":  "14,99 \\u20AC",
        "image":  "/products/run-watch-w200.jpg",
        "categoryKey":  "watch",
        "categoryLabel":  "Montres",
        "badge":  "D\\u00E9butant",
        "description":  "Simple, affordable watch with stopwatch and lap functions."
    },
    {
        "id":  "run-watch-w500",
        "name":  "W500 M Running Watch",
        "price":  "19,99 \\u20AC",
        "image":  "/products/run-watch-w500.jpg",
        "categoryKey":  "watch",
        "categoryLabel":  "Montres",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Water-resistant running watch with interval timer."
    },
    {
        "id":  "run-watch-gps",
        "name":  "GPS 500 Running Watch",
        "price":  "139,99 \\u20AC",
        "image":  "/products/run-watch-gps.jpg",
        "categoryKey":  "watch",
        "categoryLabel":  "Montres",
        "badge":  "Avanc\\u00E9",
        "description":  "GPS running watch for tracking distance, pace and routes."
    },
    {
        "id":  "run-belt-100",
        "name":  "Run 100 Smartphone Belt",
        "price":  "9,99 \\u20AC",
        "image":  "/products/run-belt-100.jpg",
        "categoryKey":  "belt",
        "categoryLabel":  "Ceintures",
        "badge":  "Tous niveaux",
        "description":  "Minimalist belt for carrying a phone and keys while running."
    },
    {
        "id":  "run-belt-500",
        "name":  "Run 500 Multi-Pocket Belt",
        "price":  "14,99 \\u20AC",
        "image":  "/products/run-belt-500.jpg",
        "categoryKey":  "belt",
        "categoryLabel":  "Ceintures",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Belt with multiple pockets for phone, keys and gels."
    },
    {
        "id":  "run-armband",
        "name":  "Run Smartphone Armband",
        "price":  "9,99 \\u20AC",
        "image":  "/products/run-armband.jpg",
        "categoryKey":  "armband",
        "categoryLabel":  "Brassards",
        "badge":  "Tous niveaux",
        "description":  "Adjustable armband to carry a phone on the arm."
    },
    {
        "id":  "run-flask-250",
        "name":  "Run Soft Flask 250 ml",
        "price":  "11,99 \\u20AC",
        "image":  "/products/run-flask-250.jpg",
        "categoryKey":  "hydration",
        "categoryLabel":  "Hydratation",
        "badge":  "Tous niveaux",
        "description":  "Soft flask for carrying small amounts of water on runs."
    },
    {
        "id":  "run-belt-hydration",
        "name":  "Run Hydration Belt 2 x 250 ml",
        "price":  "24,99 \\u20AC",
        "image":  "/products/run-belt-hydration.jpg",
        "categoryKey":  "hydration",
        "categoryLabel":  "Hydratation",
        "badge":  "Interm\\u00E9diaire",
        "description":  "Hydration belt with two flasks for longer runs."
    },
    {
        "id":  "run-vest-5l",
        "name":  "Run Light 5L Hydration Vest",
        "price":  "29,99 \\u20AC",
        "image":  "/products/run-vest-5l.jpg",
        "categoryKey":  "hydration",
        "categoryLabel":  "Hydratation",
        "badge":  "Avanc\\u00E9",
        "description":  "Light running vest with water storage and pockets for long-distance training."
    },
    {
        "id":  "run-light-vis",
        "name":  "Run 100 Clip-On Visibility Light",
        "price":  "7,99 \\u20AC",
        "image":  "/products/run-light-vis.jpg",
        "categoryKey":  "safety",
        "categoryLabel":  "S\\u00E9curit\\u00E9",
        "badge":  "Tous niveaux",
        "description":  "Clip-on LED light to be seen at night."
    },
    {
        "id":  "run-vest-vis",
        "name":  "Run High-Visibility Vest",
        "price":  "12,99 \\u20AC",
        "image":  "/products/run-vest-vis.jpg",
        "categoryKey":  "safety",
        "categoryLabel":  "S\\u00E9curit\\u00E9",
        "badge":  "Tous niveaux",
        "description":  "Fluorescent vest with reflective strips for running in low light."
    },
    {
        "id":  "run-headlamp-900",
        "name":  "Runlight 900 USB Headlamp",
        "price":  "59,99 \\u20AC",
        "image":  "/products/run-headlamp-900.jpg",
        "categoryKey":  "safety",
        "categoryLabel":  "S\\u00E9curit\\u00E9",
        "badge":  "Avanc\\u00E9",
        "description":  "Powerful chest/headlamp for running safely in the dark."
    },
    {
        "id":  "run-foam-roller",
        "name":  "Massage Foam Roller",
        "price":  "14,99 \\u20AC",
        "image":  "/products/run-foam-roller.jpg",
        "categoryKey":  "recovery",
        "categoryLabel":  "R\\u00E9cup\\u00E9ration",
        "badge":  "Tous niveaux",
        "description":  "Foam roller to massage muscles after runs."
    },
    {
        "id":  "run-massage-ball",
        "name":  "Massage Ball Set",
        "price":  "5,49 \\u20AC",
        "image":  "/products/run-massage-ball.jpg",
        "categoryKey":  "recovery",
        "categoryLabel":  "R\\u00E9cup\\u00E9ration",
        "badge":  "Tous niveaux",
        "description":  "Small balls for targeted muscle massage and trigger points."
    },
    {
        "id":  "run-stretch-strap",
        "name":  "Stretching Strap",
        "price":  "4,99 \\u20AC",
        "image":  "/products/run-stretch-strap.jpg",
        "categoryKey":  "recovery",
        "categoryLabel":  "R\\u00E9cup\\u00E9ration",
        "badge":  "Tous niveaux",
        "description":  "Strap to help with stretching after running sessions."
    },
    {
        "id":  "run-earphones-bt",
        "name":  "Wireless Bluetooth Running Earphones",
        "price":  "39,99 \\u20AC",
        "image":  "/products/run-earphones-bt.jpg",
        "categoryKey":  "audio",
        "categoryLabel":  "Audio",
        "badge":  "Tous niveaux",
        "description":  "Sweat-resistant wireless earphones designed for running."
    }
];\n
