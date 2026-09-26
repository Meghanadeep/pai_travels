/**
 * Seed script: creates or updates the admin account and removes any sample data
 * (isSample = true). Set SEED_SAMPLE_DATA=true to also create clearly-labelled
 * SAMPLE trips, inquiries and reviews for trying the site out.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { TripType, TripStatus } from "../src/generated/prisma/enums";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=80`;

const today = new Date();
const dayUtc = (offset: number) =>
  new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset));

const SAMPLE_NOTE =
  "SAMPLE CONTENT — this is placeholder text created to demonstrate the website. Replace it with your real trip details from the admin portal before publishing.";

const standardCancellation =
  "Sample policy — replace with your own terms. More than 60 days before departure: full refund less a processing fee. 59–30 days: 50% refund. Fewer than 30 days: non-refundable. See the site-wide Cancellation Policy for details.";

type SampleTrip = {
  slug: string;
  title: string;
  destination: string;
  country: string;
  tripType: TripType;
  status?: TripStatus;
  featured?: boolean;
  durationDays: number;
  groupSizeMax: number;
  summary: string;
  highlights: string[];
  images: { id: string; alt: string }[];
  days: string[];
  basePrice: number;
};

const trips: SampleTrip[] = [
  {
    slug: "kerala-backwaters-and-spice-hills",
    title: "Backwaters & Spice Hills",
    destination: "Kerala",
    country: "India",
    tripType: "NATURE",
    featured: true,
    durationDays: 7,
    groupSizeMax: 12,
    summary: "A slow week between palm-fringed backwaters and cool hill country. Sample itinerary — replace with your own.",
    highlights: ["Overnight on a traditional houseboat (sample)", "Tea and spice estate walks (sample)", "Village canoe mornings (sample)", "Time set aside to simply rest"],
    images: [
      { id: "1602216056096-3b40cc0c9944", alt: "A thatched houseboat drifting on a backwater lined with coconut palms" },
      { id: "1590050752117-238cb0fb12b1", alt: "Canoe on a narrow palm-shaded canal at sunset" },
      { id: "1581791534721-e599df4417f7", alt: "A clear river running over rocks through green forest" },
    ],
    days: ["Arrival & welcome dinner", "Old town walk", "Into the hills", "Spice and tea country", "Down to the backwaters", "Houseboat day", "Departure"],
    basePrice: 68000,
  },
  {
    slug: "royal-rajasthan-palaces-and-desert",
    title: "Palaces of Rajasthan",
    destination: "Rajasthan",
    country: "India",
    tripType: "HERITAGE",
    featured: true,
    durationDays: 10,
    groupSizeMax: 14,
    summary: "Pink city façades, hilltop forts and desert light across ten unhurried days. Sample itinerary — replace with your own.",
    highlights: ["Guided walks through historic old cities (sample)", "Fort visits at the quietest hours (sample)", "Heritage-style stays (sample)", "An evening in the desert (sample)"],
    images: [
      { id: "1545126178-862cdb469409", alt: "The honeycomb façade of the Hawa Mahal lit up at dusk" },
      { id: "1477587458883-47145ed94245", alt: "Decorated horses and carriages in front of the Hawa Mahal" },
      { id: "1599661046289-e31897846e41", alt: "Sandstone ramparts and gateways of a hilltop fort in warm light" },
    ],
    days: ["Arrival in Jaipur", "The pink city", "Hilltop fort", "Road to the lakes", "Lake city", "Craft villages", "Into the desert", "Desert camp", "Blue city", "Departure"],
    basePrice: 112000,
  },
  {
    slug: "golden-triangle-delhi-agra-jaipur",
    title: "The Golden Triangle",
    destination: "Delhi, Agra & Jaipur",
    country: "India",
    tripType: "HERITAGE",
    durationDays: 6,
    groupSizeMax: 16,
    summary: "A compact first journey through three storied cities. Sample itinerary — replace with your own.",
    highlights: ["Sunrise visit to the Taj Mahal (sample)", "Old Delhi food walk (sample)", "Private guide throughout (sample)"],
    images: [
      { id: "1548013146-72479768bada", alt: "The Taj Mahal framed by a carved sandstone archway" },
      { id: "1524492412937-b28074a5d7da", alt: "The Taj Mahal reflected in the long garden pool" },
      { id: "1587474260584-136574528ed5", alt: "India Gate under a violet evening sky" },
    ],
    days: ["Arrival in Delhi", "Old and New Delhi", "To Agra", "Sunrise at the Taj", "Jaipur", "Departure"],
    basePrice: 54000,
  },
  {
    slug: "himalayan-trails-everest-region",
    title: "Himalayan Trails",
    destination: "Everest Region",
    country: "Nepal",
    tripType: "ADVENTURE",
    featured: true,
    durationDays: 14,
    groupSizeMax: 10,
    summary: "Teahouse trekking beneath the world's highest peaks, paced for acclimatisation. Sample itinerary — replace with your own.",
    highlights: ["Experienced trek leaders (sample)", "Acclimatisation days built in (sample)", "Monastery visits (sample)", "Small group of up to 10"],
    images: [
      { id: "1544735716-392fe2489ffa", alt: "Snow-covered Himalayan peaks above a forested ridge and stupa" },
      { id: "1526772662000-3f88f10405ff", alt: "A trekker looking out over a mountain valley" },
      { id: "1519681393784-d120267933ba", alt: "The Milky Way over snowy mountain summits" },
      { id: "1506905925346-21bda4d32df4", alt: "Mountain peaks rising above a sea of clouds" },
    ],
    days: ["Arrival in Kathmandu", "Briefing & gear check", "Fly to the trailhead", "River valley walk", "Climb to the market town", "Acclimatisation day", "Monastery trail", "High valley", "Viewpoint day", "Rest and explore", "Descent begins", "Back to the trailhead", "Return to Kathmandu", "Departure"],
    basePrice: 145000,
  },
  {
    slug: "kyoto-kitchens-and-old-lanes",
    title: "Kyoto Kitchens & Old Lanes",
    destination: "Kyoto",
    country: "Japan",
    tripType: "CULINARY",
    durationDays: 8,
    groupSizeMax: 10,
    summary: "Markets, tea rooms and lantern-lit lanes, with time at the table. Sample itinerary — replace with your own.",
    highlights: ["Market mornings with a local guide (sample)", "Cooking class (sample)", "Tea ceremony (sample)", "Early walks before the crowds"],
    images: [{ id: "1493976040374-85c8e12f0c0e", alt: "A traditional lane of wooden houses leading to a pagoda at dusk" }],
    days: ["Arrival", "Old lanes walk", "Market morning", "Cooking class", "Temples & gardens", "Tea country day trip", "Free day", "Departure"],
    basePrice: 198000,
  },
  {
    slug: "bali-temples-and-rice-terraces-retreat",
    title: "Temples & Terraces Retreat",
    destination: "Bali",
    country: "Indonesia",
    tripType: "WELLNESS",
    durationDays: 9,
    groupSizeMax: 12,
    summary: "Morning practice, afternoon temples and long evenings of rest. Sample itinerary — replace with your own.",
    highlights: ["Daily morning yoga (sample)", "Lake and sea temple visits (sample)", "Rice terrace walks (sample)"],
    images: [
      { id: "1537996194471-e657df975ab4", alt: "Tiered temple shrines on the edge of a misty lake" },
      { id: "1518548419970-58e3b4079ab2", alt: "A temple on a rocky outcrop at sunset" },
    ],
    days: ["Arrival & settling in", "Morning practice", "Rice terraces", "Lake temple", "Rest day", "Waterfall walk", "Sea temple at sunset", "Closing circle", "Departure"],
    basePrice: 124000,
  },
  {
    slug: "dolomites-lakes-and-peaks",
    title: "Lakes & Peaks of the Dolomites",
    destination: "Dolomites",
    country: "Italy",
    tripType: "ADVENTURE",
    durationDays: 8,
    groupSizeMax: 12,
    summary: "Hut-to-valley hiking among pale limestone towers and emerald lakes. Sample itinerary — replace with your own.",
    highlights: ["Guided day hikes (sample)", "Alpine lake mornings (sample)", "Mountain hut lunches (sample)"],
    images: [
      { id: "1476514525535-07fb3b4ae5f1", alt: "Bow of a wooden boat on a turquoise alpine lake below peaks" },
      { id: "1501785888041-af3ef285b470", alt: "Rowing boat on a clear green lake surrounded by cliffs" },
      { id: "1464822759023-fed622ff2c3b", alt: "Pine forest in front of a wide snow-capped mountain range" },
    ],
    days: ["Arrival", "Lake loop", "First high trail", "Hut day", "Rest & village", "Ridge walk", "Farewell hike", "Departure"],
    basePrice: 235000,
  },
  {
    slug: "ha-long-bay-and-northern-vietnam",
    title: "Ha Long Bay & the North",
    destination: "Ha Long Bay",
    country: "Vietnam",
    tripType: "COASTAL",
    durationDays: 7,
    groupSizeMax: 14,
    summary: "Limestone karsts, quiet coves and a night on the water. Sample itinerary — replace with your own.",
    highlights: ["Overnight cruise on the bay (sample)", "Kayaking between karsts (sample)", "Old quarter food walk (sample)"],
    images: [
      { id: "1528127269322-539801943592", alt: "Boats among limestone karst islands in a green bay" },
      { id: "1507525428034-b723cf961d3e", alt: "Soft waves on a pale sand beach at sunrise" },
    ],
    days: ["Arrival in Hanoi", "Old quarter", "To the bay", "Karsts by kayak", "Back to Hanoi", "Countryside day", "Departure"],
    basePrice: 89000,
  },
  {
    slug: "konkan-coast-draft",
    title: "Konkan Coast (Draft)",
    destination: "Konkan Coast",
    country: "India",
    tripType: "COASTAL",
    status: "DRAFT",
    durationDays: 5,
    groupSizeMax: 10,
    summary: "A draft trip that is not visible on the public site. Use it to try the admin tools.",
    highlights: ["Draft highlight"],
    images: [{ id: "1512343879784-a960bf40e7f2", alt: "Turquoise water and a palm-lined beach" }],
    days: ["Arrival", "Coast day", "Fort walk", "Beach day", "Departure"],
    basePrice: 42000,
  },
];

async function main() {
  // ── Admin account ────────────────────────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, name: "Administrator", passwordHash },
  });
  console.log(`✔ Admin account ready: ${email}`);

  // ── Remove previous sample data ──────────────────────────────────────────────
  const oldSample = await prisma.trip.findMany({ where: { isSample: true }, select: { id: true } });
  const ids = oldSample.map((t) => t.id);
  await prisma.inquiry.deleteMany({ where: { tripId: { in: ids } } });
  await prisma.review.deleteMany({ where: { isSample: true } });
  await prisma.trip.deleteMany({ where: { id: { in: ids } } });
  if (ids.length) console.log(`✔ Removed ${ids.length} sample trips with their departures, inquiries and sample reviews`);

  if (process.env.SEED_SAMPLE_DATA !== "true") {
    console.log("Sample data not created (set SEED_SAMPLE_DATA=true to add it).");
    return;
  }

  // ── Sample trips ─────────────────────────────────────────────────────────────
  const offsets = [18, 46, 83, 130, 190];
  const created: { id: string; slug: string }[] = [];

  for (const [i, t] of trips.entries()) {
    const status = t.status ?? "PUBLISHED";
    const trip = await prisma.trip.create({
      data: {
        slug: t.slug,
        title: t.title,
        destination: t.destination,
        country: t.country,
        tripType: t.tripType,
        status,
        featured: t.featured ?? false,
        isSample: true,
        summary: t.summary,
        overview: `${SAMPLE_NOTE}\n\nThis sample shows how a ${t.durationDays}-day journey in ${t.destination} could be presented: an introduction to the pace and character of the trip, who it suits, and what makes it distinctive. Write two or three short paragraphs here describing your real trip.`,
        highlights: t.highlights,
        accommodation:
          "Sample — describe the real properties here: style of stay, room type (twin/double share), single supplement, and any nights in special accommodation such as camps, houseboats or mountain huts.",
        transport:
          "Sample — describe transfers and ground transport here: vehicle type, internal flights or trains, and luggage allowances.",
        meals: "Sample — list which meals are included (e.g. daily breakfast, some dinners) and how dietary needs are handled.",
        inclusions: ["Accommodation as described (sample)", "Services of a trip leader (sample)", "Listed meals (sample)", "Entrance fees for listed sites (sample)", "Airport arrival transfer (sample)"],
        exclusions: ["International flights", "Travel insurance", "Visa fees", "Personal expenses and tips", "Meals not listed"],
        meetingPoint: "Sample — give the exact meeting place, time and what to do if a flight is delayed.",
        cancellationPolicy: standardCancellation,
        requirements:
          "Sample — list real requirements here: passport validity, visas, recommended vaccinations, fitness level, altitude considerations, and mandatory travel insurance.",
        durationDays: t.durationDays,
        groupSizeMin: 2,
        groupSizeMax: t.groupSizeMax,
        coverImageUrl: img(t.images[0].id),
        coverImageAlt: t.images[0].alt,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        images: { create: t.images.map((im, idx) => ({ url: img(im.id), alt: im.alt, sortOrder: idx })) },
        itinerary: {
          create: t.days.map((title, idx) => ({
            dayNumber: idx + 1,
            title,
            description: `Sample day description — replace with what actually happens on day ${idx + 1}: the morning, the main visit or activity, travel time, and how the evening is spent.`,
            meals: idx === 0 ? "Dinner" : idx === t.days.length - 1 ? "Breakfast" : "Breakfast",
            overnight: idx === t.days.length - 1 ? null : `Sample accommodation, ${t.destination}`,
          })),
        },
        faqs: {
          create: [
            { question: "Is this a real trip?", answer: "Not yet — this is sample content to demonstrate the site. Replace it with your own details in the admin portal.", sortOrder: 0 },
            { question: "Can I travel solo?", answer: "Sample answer — explain your single supplement or room-sharing policy here.", sortOrder: 1 },
            { question: "How fit do I need to be?", answer: "Sample answer — describe the activity level honestly, including daily walking times and terrain.", sortOrder: 2 },
          ],
        },
      },
    });
    created.push({ id: trip.id, slug: trip.slug });

    // Departures: a past one (to prove it is hidden) plus future dates with varied states.
    const capacity = t.groupSizeMax;
    const dep = (offset: number, extra: object = {}) => ({
      tripId: trip.id,
      startDate: dayUtc(offset),
      endDate: dayUtc(offset + t.durationDays - 1),
      price: t.basePrice,
      capacity,
      ...extra,
    });
    await prisma.departure.createMany({
      data: [
        dep(-40, { note: "Past departure — not shown publicly" }),
        dep(offsets[i % 2] + i * 3),
        dep(offsets[2] + i * 2, {
          earlyBirdPrice: Math.round((t.basePrice * 0.9) / 500) * 500,
          earlyBirdEndsAt: dayUtc(offsets[2] + i * 2 - 45),
          note: "Early bird offer (sample)",
        }),
        dep(offsets[3] + i * 4, { price: Math.round((t.basePrice * 1.08) / 500) * 500, note: "Peak season (sample)" }),
        dep(offsets[4] + i, { status: i % 3 === 0 ? "CLOSED" : "OPEN" }),
      ],
    });
  }

  // ── Sample inquiries (hold seats so availability states can be seen) ─────────
  const kerala = created[0];
  const keralaDeps = await prisma.departure.findMany({
    where: { tripId: kerala.id, startDate: { gt: dayUtc(0) } },
    orderBy: { startDate: "asc" },
  });
  const first = keralaDeps[0];
  const sampleInquiries = [
    { travellers: 6, fullName: "Sample Guest A", status: "CONFIRMED" as const },
    { travellers: 4, fullName: "Sample Guest B", status: "NEW" as const },
  ];
  for (const [n, s] of sampleInquiries.entries()) {
    await prisma.inquiry.create({
      data: {
        reference: `PT-SAMPLE${n + 1}`,
        tripId: kerala.id,
        departureId: first.id,
        travellers: s.travellers,
        fullName: s.fullName,
        email: `sample.guest${n + 1}@example.com`,
        phone: "+91 00000 00000",
        message: "Sample inquiry created by the seed script.",
        pricePerPerson: first.price,
        status: s.status,
        holdsSeats: true,
      },
    });
  }
  await prisma.departure.update({
    where: { id: first.id },
    data: { seatsReserved: sampleInquiries.reduce((a, s) => a + s.travellers, 0) },
  });

  // Sold-out example on the Golden Triangle's first departure.
  const golden = created[2];
  const goldenFirst = await prisma.departure.findFirst({
    where: { tripId: golden.id, startDate: { gt: dayUtc(0) } },
    orderBy: { startDate: "asc" },
  });
  if (goldenFirst) {
    await prisma.inquiry.create({
      data: {
        reference: "PT-SAMPLE3",
        tripId: golden.id,
        departureId: goldenFirst.id,
        travellers: goldenFirst.capacity,
        fullName: "Sample Group C",
        email: "sample.group@example.com",
        phone: "+91 00000 00000",
        pricePerPerson: goldenFirst.price,
        status: "CONFIRMED",
        holdsSeats: true,
      },
    });
    await prisma.departure.update({ where: { id: goldenFirst.id }, data: { seatsReserved: goldenFirst.capacity } });
  }

  // ── Sample reviews ───────────────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        name: "Sample Reviewer",
        location: "Placeholder city",
        rating: 5,
        body: "This is a sample review to show the layout. Replace it with genuine feedback from your travellers — with their permission.",
        tripId: created[0].id,
        isSample: true,
      },
      {
        name: "Sample Reviewer",
        location: "Placeholder city",
        rating: 5,
        body: "Sample review text. Real reviews build trust only when they are real — collect them after each departure and add them from the admin portal.",
        tripId: created[1].id,
        isSample: true,
      },
      {
        name: "Sample Reviewer",
        location: "Placeholder city",
        rating: 4,
        body: "Another placeholder review. Keep reviews short, specific and attributed with the traveller's consent.",
        tripId: created[3].id,
        isSample: true,
      },
    ],
  });

  console.log(`✔ Seeded ${created.length} sample trips (1 draft), departures, 3 sample inquiries and 3 sample reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
