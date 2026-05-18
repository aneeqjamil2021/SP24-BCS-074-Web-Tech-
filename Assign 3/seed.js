const mongoose = require('mongoose');
const Product = require('./models/Product');

const seedProducts = [
    { name: "Sony WH-1000XM5 Noise Cancelling Headphones", price: 348.00, category: "Electronics", rating: 4.8, stock: 45, image: "/img/Promo/headphones.webp" },
    { name: "Apple MacBook Air M2", price: 1099.00, category: "Electronics", rating: 4.9, stock: 20, image: "/img/laptop.webp" },
    { name: "Nintendo Switch OLED Model Neon Blue/Red", price: 249.00, category: "Electronics", rating: 4.7, stock: 15, image: "/img/Promo/console.webp" },
    { name: "Apple iPhone 14 Pro Max 256GB Unlocked", price: 499.00, category: "Electronics", rating: 4.5, stock: 30, image: "/img/promo/iphone.webp" },
    { name: "MSI Gaming Laptop 15.6\" 144Hz i7 RTX 4060", price: 650.00, category: "Electronics", rating: 4.6, stock: 12, image: "/img/promo/gaminglaptop.webp" },
    { name: "Samsung Galaxy S23 Ultra", price: 999.00, category: "Electronics", rating: 4.8, stock: 25, image: "/img/smartphones.webp" },
    { name: "Logitech MX Master 3S Wireless Mouse", price: 99.00, category: "Electronics", rating: 4.7, stock: 60, image: "/img/computerpics.webp" },
    { name: "Dell UltraSharp 27 4K USB-C Hub Monitor", price: 549.00, category: "Electronics", rating: 4.6, stock: 18, image: "/img/computerpics.webp" },
    { name: "LG C3 Series 55-Inch Class OLED evo 4K", price: 1296.00, category: "Electronics", rating: 4.9, stock: 8, image: "/img/promo/gaminglaptop.webp" }, // placeholder image
    { name: "Men's Classic Cotton T-Shirt", price: 15.00, category: "Fashion", rating: 4.2, stock: 150, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Levi's Men's 501 Original Fit Jeans", price: 59.50, category: "Fashion", rating: 4.5, stock: 85, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Nike Air Force 1 '07", price: 110.00, category: "Fashion", rating: 4.8, stock: 40, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Women's Floral Summer Dress", price: 35.00, category: "Fashion", rating: 4.3, stock: 60, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Adidas Ultraboost 23", price: 190.00, category: "Fashion", rating: 4.7, stock: 30, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Ray-Ban Classic Aviator Sunglasses", price: 163.00, category: "Fashion", rating: 4.6, stock: 25, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Casio G-Shock Digital Watch", price: 45.00, category: "Fashion", rating: 4.4, stock: 100, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Patagonia Men's Better Sweater Fleece Jacket", price: 149.00, category: "Fashion", rating: 4.8, stock: 50, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "North Face Recon Backpack", price: 99.00, category: "Fashion", rating: 4.7, stock: 70, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Calvin Klein Men's Boxer Briefs (3-Pack)", price: 42.00, category: "Fashion", rating: 4.5, stock: 120, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "KitchenAid Artisan Series 5-Qt. Stand Mixer", price: 449.00, category: "Home", rating: 4.9, stock: 15, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Dyson V11 Cordless Stick Vacuum", price: 599.00, category: "Home", rating: 4.8, stock: 10, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker", price: 99.00, category: "Home", rating: 4.7, stock: 80, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Ninja Professional Blender", price: 89.00, category: "Home", rating: 4.6, stock: 45, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "YETI Rambler 20 oz Tumbler", price: 35.00, category: "Home", rating: 4.8, stock: 200, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Lodge Cast Iron Skillet, 10.25-inch", price: 19.90, category: "Home", rating: 4.9, stock: 150, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Nespresso VertuoPlus Coffee and Espresso Machine", price: 159.00, category: "Home", rating: 4.7, stock: 35, image: "/img/promo/gaminglaptop.webp" }, // fallback
    { name: "Bose SoundLink Flex Bluetooth Portable Speaker", price: 149.00, category: "Electronics", rating: 4.8, stock: 55, image: "/img/Promo/headphones.webp" },
    { name: "GoPro HERO11 Black", price: 399.00, category: "Electronics", rating: 4.6, stock: 40, image: "/img/smartphones.webp" },
    { name: "Anker PowerCore 10000 Portable Charger", price: 25.00, category: "Electronics", rating: 4.5, stock: 300, image: "/img/computerpics.webp" },
    { name: "Blink Outdoor - wireless, weather-resistant HD security camera", price: 99.99, category: "Home", rating: 4.4, stock: 65, image: "/img/promo/gaminglaptop.webp" } // fallback
];

async function seedDB() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ebayClone');
        console.log("Connected to MongoDB");

        await Product.deleteMany({});
        console.log("Cleared existing products.");

        await Product.insertMany(seedProducts);
        console.log("Database seeded successfully with 30 products.");
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        mongoose.connection.close();
    }
}

seedDB();
