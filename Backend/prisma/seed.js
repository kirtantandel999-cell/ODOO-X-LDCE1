import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ── Regions ─────────────────────────────────
  console.log("📍 Seeding regions...");
  const regionData = [
    { name: "Asia", description: "The world's largest continent with diverse cultures, cuisines, and landscapes.", image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800", countryCount: 48 },
    { name: "Europe", description: "Rich history, stunning architecture, and world-class art and cuisine.", image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800", countryCount: 44 },
    { name: "North America", description: "From the Arctic tundra to tropical beaches, a continent of extremes.", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800", countryCount: 23 },
    { name: "South America", description: "Lush rainforests, ancient ruins, and vibrant cultures.", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800", countryCount: 12 },
    { name: "Africa", description: "Breathtaking safaris, ancient civilizations, and stunning natural wonders.", image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800", countryCount: 54 },
    { name: "Middle East", description: "Where ancient history meets modern luxury and innovation.", image: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800", countryCount: 17 },
    { name: "Oceania", description: "Islands of paradise, unique wildlife, and stunning coral reefs.", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", countryCount: 14 },
  ];

  const regions = {};
  for (const r of regionData) {
    const region = await prisma.region.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    regions[r.name] = region;
    console.log(`  ✅ Region: ${region.name} (id: ${region.id})`);
  }

  // ── Destinations ─────────────────────────────
  console.log("🗺️  Seeding destinations...");
  const destinationData = [
    // Asia
    { name: "Tokyo", country: "Japan", city: "Tokyo", description: "A dazzling blend of ultramodern and traditional, with skyscrapers, temples, and world-class cuisine.", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", regionName: "Asia", latitude: 35.6762, longitude: 139.6503, popularity: 98 },
    { name: "Kyoto", country: "Japan", city: "Kyoto", description: "Japan's ancient capital, home to stunning temples, geisha districts, and traditional tea ceremonies.", image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800", regionName: "Asia", latitude: 35.0116, longitude: 135.7681, popularity: 92 },
    { name: "Bali", country: "Indonesia", city: "Bali", description: "Island of the Gods — lush rice terraces, stunning temples, and vibrant nightlife.", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", regionName: "Asia", latitude: -8.3405, longitude: 115.0920, popularity: 95 },
    { name: "Bangkok", country: "Thailand", city: "Bangkok", description: "Thailand's vibrant capital with ornate temples, bustling street markets, and incredible street food.", image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800", regionName: "Asia", latitude: 13.7563, longitude: 100.5018, popularity: 90 },
    { name: "Singapore", country: "Singapore", city: "Singapore", description: "A futuristic city-state with world-class dining, shopping, and the iconic Marina Bay Sands.", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800", regionName: "Asia", latitude: 1.3521, longitude: 103.8198, popularity: 88 },
    { name: "Mumbai", country: "India", city: "Mumbai", description: "India's bustling financial capital — the city of dreams, Bollywood, and Gateway of India.", image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800", regionName: "Asia", latitude: 19.0760, longitude: 72.8777, popularity: 80 },
    { name: "Delhi", country: "India", city: "New Delhi", description: "India's capital — a rich tapestry of Mughal architecture, vibrant bazaars, and street food.", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800", regionName: "Asia", latitude: 28.6139, longitude: 77.2090, popularity: 78 },

    // Europe
    { name: "Paris", country: "France", city: "Paris", description: "The City of Light — the Eiffel Tower, the Louvre, world-class cuisine, and timeless romance.", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", regionName: "Europe", latitude: 48.8566, longitude: 2.3522, popularity: 99 },
    { name: "London", country: "United Kingdom", city: "London", description: "A world city with iconic landmarks, world-class museums, and a vibrant multicultural culture.", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800", regionName: "Europe", latitude: 51.5074, longitude: -0.1278, popularity: 97 },
    { name: "Rome", country: "Italy", city: "Rome", description: "The Eternal City — the Colosseum, Vatican, breathtaking art, and incredible Italian cuisine.", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", regionName: "Europe", latitude: 41.9028, longitude: 12.4964, popularity: 95 },
    { name: "Barcelona", country: "Spain", city: "Barcelona", description: "Gaudí's architectural masterpieces, beautiful beaches, vibrant nightlife, and tapas.", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800", regionName: "Europe", latitude: 41.3851, longitude: 2.1734, popularity: 91 },

    // North America
    { name: "New York City", country: "United States", city: "New York", description: "The Big Apple — Times Square, Central Park, world-class museums, and iconic skyline.", image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800", regionName: "North America", latitude: 40.7128, longitude: -74.0060, popularity: 99 },

    // Middle East
    { name: "Dubai", country: "United Arab Emirates", city: "Dubai", description: "A city of superlatives — the Burj Khalifa, luxury shopping, desert safaris, and stunning architecture.", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", regionName: "Middle East", latitude: 25.2048, longitude: 55.2708, popularity: 93 },

    // Africa
    { name: "Cairo", country: "Egypt", city: "Cairo", description: "Home to the Great Pyramids and Sphinx — one of the world's oldest and most fascinating cities.", image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73cbb?w=800", regionName: "Africa", latitude: 30.0444, longitude: 31.2357, popularity: 87 },

    // Oceania
    { name: "Sydney", country: "Australia", city: "Sydney", description: "The Opera House, Harbour Bridge, beautiful beaches, and a warm relaxed lifestyle.", image: "https://images.unsplash.com/photo-1524293568345-75d62c3664f7?w=800", regionName: "Oceania", latitude: -33.8688, longitude: 151.2093, popularity: 94 },
  ];

  const destinations = {};
  for (const d of destinationData) {
    const { regionName, ...data } = d;
    const dest = await prisma.destination.create({
      data: { ...data, regionId: regions[regionName].id },
    });
    destinations[d.name] = dest;
    console.log(`  ✅ Destination: ${dest.name}, ${dest.country} (id: ${dest.id})`);
  }

  // ── Banners ──────────────────────────────────
  console.log("🖼️  Seeding banners...");
  await prisma.banner.createMany({
    data: [
      {
        title: "Explore the World with GlobeTrotter",
        subtitle: "Discover breathtaking destinations across 7 continents. Plan your perfect trip today.",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600",
        badge: "🌍 New Adventures Await",
        buttonText: "Plan a Trip",
        buttonLink: "/trips/plan",
        isActive: true,
      },
      {
        title: "Asia's Hidden Gems",
        subtitle: "From Tokyo's neon lights to Bali's rice terraces — Asia has it all.",
        image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1600",
        badge: "🏯 Featured Region",
        buttonText: "Explore Asia",
        buttonLink: "/regions/asia",
        isActive: false,
      },
    ],
    skipDuplicates: true,
  });
  console.log("  ✅ Banners created.");

  console.log("\n✅ Seed completed successfully!");
  console.log(`   Regions:      ${Object.keys(regions).length}`);
  console.log(`   Destinations: ${Object.keys(destinations).length}`);
  console.log("   Banners:      2");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
