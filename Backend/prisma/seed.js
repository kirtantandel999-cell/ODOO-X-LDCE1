import "dotenv/config";
import bcrypt from "bcryptjs";
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
    let dest = await prisma.destination.findFirst({
      where: { name: data.name, country: data.country },
    });
    if (!dest) {
      dest = await prisma.destination.create({
        data: { ...data, regionId: regions[regionName].id },
      });
    }
    destinations[d.name] = dest;
    console.log(`  ✅ Destination: ${dest.name}, ${dest.country} (id: ${dest.id})`);
  }

  // ── Activities ───────────────────────────────
  console.log("🎯 Seeding activities (22 activities across categories)...");
  const activityData = [
    // Tokyo / Japan
    { name: "Tokyo Tower Observation Deck", description: "Panoramic 360-degree views of Tokyo skyline and Mount Fuji.", category: "Sightseeing", city: "Tokyo", country: "Japan", latitude: 35.6586, longitude: 139.7454, estimatedDuration: 2.0, estimatedCost: 1500, popularity: 96, image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800" },
    { name: "Shibuya Crossing & Hachiko Statue", description: "Experience the world's busiest pedestrian crossing and visit the loyal dog memorial.", category: "Culture", city: "Tokyo", country: "Japan", latitude: 35.6595, longitude: 139.7005, estimatedDuration: 1.5, estimatedCost: 0, popularity: 98, image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800" },
    { name: "Tsukiji Outer Market Sushi Tour", description: "Taste fresh sashimi, wagyu beef skewers, and traditional Japanese street foods.", category: "Food", city: "Tokyo", country: "Japan", latitude: 35.6655, longitude: 139.7707, estimatedDuration: 3.0, estimatedCost: 3500, popularity: 94, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800" },
    { name: "Mount Fuji & Hakone Day Trip", description: "Scenic ropeway tour, Lake Ashi cruise, and breathtaking views of Fuji-san.", category: "Nature", city: "Tokyo", country: "Japan", latitude: 35.3606, longitude: 138.7274, estimatedDuration: 8.0, estimatedCost: 7500, popularity: 97, image: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800" },

    // Kyoto / Japan
    { name: "Fushimi Inari Shrine Hike", description: "Walk beneath thousands of vermilion torii gates winding up sacred Mount Inari.", category: "Culture", city: "Kyoto", country: "Japan", latitude: 34.9671, longitude: 135.7727, estimatedDuration: 3.0, estimatedCost: 0, popularity: 97, image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800" },
    { name: "Arashiyama Bamboo Grove & Monkey Park", description: "Stroll through towering bamboo stalks and feed wild macaques at Iwatayama.", category: "Nature", city: "Kyoto", country: "Japan", latitude: 35.0170, longitude: 135.6713, estimatedDuration: 3.5, estimatedCost: 600, popularity: 93, image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800" },

    // Paris / France
    { name: "Eiffel Tower Summit Tour", description: "Ascend to the highest accessible observation platform in the European Union.", category: "Sightseeing", city: "Paris", country: "France", latitude: 48.8584, longitude: 2.2945, estimatedDuration: 2.5, estimatedCost: 2800, popularity: 99, image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800" },
    { name: "Louvre Museum Guided Art Tour", description: "Discover the Mona Lisa, Venus de Milo, and masterpieces of world art history.", category: "Culture", city: "Paris", country: "France", latitude: 48.8606, longitude: 2.3376, estimatedDuration: 4.0, estimatedCost: 2200, popularity: 98, image: "https://images.unsplash.com/photo-1565099824688-e93eb20fe622?w=800" },
    { name: "Seine River Dinner Cruise", description: "Gourmet multi-course French dinner gliding past illuminated Parisian monuments.", category: "Entertainment", city: "Paris", country: "France", latitude: 48.8600, longitude: 2.3200, estimatedDuration: 2.5, estimatedCost: 6500, popularity: 92, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800" },

    // London / UK
    { name: "Tower of London & Crown Jewels", description: "Explore the medieval fortress and marvel at the British monarchy's royal regalia.", category: "Culture", city: "London", country: "United Kingdom", latitude: 51.5081, longitude: -0.0759, estimatedDuration: 3.0, estimatedCost: 3200, popularity: 95, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800" },
    { name: "London Eye Flight", description: "Iconic riverside Ferris wheel offering 360-degree views across central London.", category: "Sightseeing", city: "London", country: "United Kingdom", latitude: 51.5033, longitude: -0.1195, estimatedDuration: 1.0, estimatedCost: 2800, popularity: 93, image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800" },

    // Rome / Italy
    { name: "Colosseum & Roman Forum Tour", description: "Step back into ancient gladiatorial arenas and the political heart of the Roman Empire.", category: "Culture", city: "Rome", country: "Italy", latitude: 41.8902, longitude: 12.4922, estimatedDuration: 3.5, estimatedCost: 2500, popularity: 99, image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800" },
    { name: "Vatican Museums & Sistine Chapel", description: "Marvel at Michelangelo's ceiling frescoes and St. Peter's Basilica.", category: "Culture", city: "Rome", country: "Italy", latitude: 41.9067, longitude: 12.4547, estimatedDuration: 4.0, estimatedCost: 3000, popularity: 98, image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800" },

    // Dubai / UAE
    { name: "Burj Khalifa Top Floor Experience", description: "Soar to levels 124, 125, and 148 of the world's tallest architectural marvel.", category: "Sightseeing", city: "Dubai", country: "United Arab Emirates", latitude: 25.1972, longitude: 55.2744, estimatedDuration: 2.0, estimatedCost: 4200, popularity: 97, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800" },
    { name: "Desert Safari & Dune Bashing", description: "4x4 sand dune bashing, camel riding, falconry, and barbecue dinner under desert stars.", category: "Adventure", city: "Dubai", country: "United Arab Emirates", latitude: 24.8607, longitude: 55.4500, estimatedDuration: 6.0, estimatedCost: 4500, popularity: 96, image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800" },

    // Bali / Indonesia
    { name: "Ubud Rice Terraces & Jungle Swing", description: "Soar over Tegalalang rice paddies on a giant jungle swing and visit coffee plantations.", category: "Adventure", city: "Bali", country: "Indonesia", latitude: -8.4312, longitude: 115.2778, estimatedDuration: 4.0, estimatedCost: 1500, popularity: 94, image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800" },
    { name: "Tanah Lot Sunset Temple", description: "Dramatic offshore rock temple celebrated for stunning Indian Ocean sunsets.", category: "Relaxation", city: "Bali", country: "Indonesia", latitude: -8.6212, longitude: 115.0868, estimatedDuration: 2.5, estimatedCost: 400, popularity: 91, image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800" },

    // Bangkok / Thailand
    { name: "Grand Palace & Wat Phra Kaew", description: "Marvel at Thailand's most sacred temple complex and the revered Emerald Buddha.", category: "Culture", city: "Bangkok", country: "Thailand", latitude: 13.7500, longitude: 100.4914, estimatedDuration: 3.0, estimatedCost: 1200, popularity: 92, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800" },
    { name: "Chao Phraya River Longtail Boat Tour", description: "Cruise through Bangkok's canal network (khlongs) and floating markets.", category: "Sightseeing", city: "Bangkok", country: "Thailand", latitude: 13.7465, longitude: 100.4930, estimatedDuration: 2.0, estimatedCost: 800, popularity: 88, image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800" },

    // Singapore
    { name: "Gardens by the Bay & Supertree Observatory", description: "Futuristic vertical gardens, Flower Dome, and the magnificent Cloud Forest waterfall.", category: "Nature", city: "Singapore", country: "Singapore", latitude: 1.2816, longitude: 103.8636, estimatedDuration: 3.5, estimatedCost: 2000, popularity: 96, image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800" },

    // Sydney / Australia
    { name: "Sydney Harbour Bridge Climb", description: "Climb the summit of the iconic 'Coathanger' for unforgettable 360-degree harbour panoramas.", category: "Adventure", city: "Sydney", country: "Australia", latitude: -33.8523, longitude: 151.2108, estimatedDuration: 3.5, estimatedCost: 12000, popularity: 95, image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800" },

    // Bali / Paragliding
    { name: "Tandem Paragliding Experience", description: "Breathtaking coastal paragliding flight soaring above Bali's southern cliffs and Indian Ocean.", category: "Adventure", city: "Bali", country: "Indonesia", latitude: -8.8400, longitude: 115.1800, estimatedDuration: 2.0, estimatedCost: 4500, popularity: 97, image: "https://images.unsplash.com/photo-1507034589631-9433cc6bc453?w=800" },

    // Mumbai / India
    { name: "Elephanta Caves Island Boat Trip", description: "Ferry across Mumbai harbour to ancient rock-cut cave temples dedicated to Lord Shiva.", category: "Culture", city: "Mumbai", country: "India", latitude: 18.9633, longitude: 72.9315, estimatedDuration: 4.5, estimatedCost: 500, popularity: 85, image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800" },
  ];

  for (const act of activityData) {
    const dest = destinations[act.city] || destinations[act.name] || null;
    let existing = await prisma.activity.findFirst({
      where: { name: act.name, city: act.city },
    });
    if (!existing) {
      existing = await prisma.activity.create({
        data: { ...act, destinationId: dest ? dest.id : null },
      });
    } else if (dest && !existing.destinationId) {
      existing = await prisma.activity.update({
        where: { id: existing.id },
        data: { destinationId: dest.id },
      });
    }
    console.log(`  ✅ Activity: ${existing.name} (${existing.category} - ${existing.city}) [id: ${existing.id}]`);
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

  // ── Test User & Trips for Screen 6 ───────────
  console.log("👤 Seeding test user & trips for Screen 6...");
  const hashedPassword = await bcrypt.hash("Password@123", 10);
  const testUser = await prisma.user.upsert({
    where: { email: "rudra@example.com" },
    update: { password: hashedPassword },
    create: {
      firstName: "Rudra",
      lastName: "Patel",
      email: "rudra@example.com",
      password: hashedPassword,
      phoneNumber: "9876543210",
      city: "Ahmedabad",
      country: "India",
      additionalInformation: "Traveler & Explorer",
    },
  });
  console.log(`  ✅ Test User: ${testUser.email} (id: ${testUser.id})`);

  const now = new Date();
  const ongoingStart = new Date(now);
  ongoingStart.setDate(now.getDate() - 2);
  const ongoingEnd = new Date(now);
  ongoingEnd.setDate(now.getDate() + 4);

  const tripData = [
    {
      title: "Ongoing Tokyo Adventure",
      description: "Currently exploring Tokyo and experiencing city highlights",
      startDate: ongoingStart,
      endDate: ongoingEnd,
      status: "ONGOING",
      budget: 150000,
      currency: "INR",
      destName: "Tokyo",
    },
    {
      title: "Autumn in Kyoto & Osaka",
      description: "Upcoming autumn foliage tour in Kansai region",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-20"),
      status: "PLANNED",
      budget: 220000,
      currency: "INR",
      destName: "Kyoto",
    },
    {
      title: "Winter Beach Getaway in Bali",
      description: "Year-end tropical vacation in Bali",
      startDate: new Date("2026-12-15"),
      endDate: new Date("2026-12-25"),
      status: "PLANNED",
      budget: 180000,
      currency: "INR",
      destName: "Bali",
    },
    {
      title: "Completed European Grand Tour",
      description: "Past summer vacation across Paris and Rome",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-15"),
      status: "COMPLETED",
      budget: 350000,
      currency: "INR",
      destName: "Paris",
    },
    {
      title: "Historic London Exploration",
      description: "Winter cultural tour of historic London landmarks",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-20"),
      status: "COMPLETED",
      budget: 280000,
      currency: "INR",
      destName: "London",
    },
  ];

  for (const td of tripData) {
    const { destName, ...tFields } = td;
    let existingTrip = await prisma.trip.findFirst({
      where: { userId: testUser.id, title: tFields.title },
    });
    if (!existingTrip) {
      existingTrip = await prisma.trip.create({
        data: { ...tFields, userId: testUser.id },
      });

      // Add destination
      if (destinations[destName]) {
        await prisma.tripDestination.create({
          data: {
            tripId: existingTrip.id,
            destinationId: destinations[destName].id,
            order: 1,
          },
        });
      }
      console.log(`  ✅ Trip: ${existingTrip.title} (Status: ${existingTrip.status})`);
    }
  }

  console.log("\n✅ Seed completed successfully!");
  console.log(`   Regions:      ${Object.keys(regions).length}`);
  console.log(`   Destinations: ${Object.keys(destinations).length}`);
  console.log(`   Activities:   ${activityData.length}`);
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
