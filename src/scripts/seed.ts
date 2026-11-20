import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import dns from "dns";
import { User } from "../models/User";
import { Service } from "../models/Service";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore fallback
}

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI not found in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Password hashes
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Himel12345", salt);
    const vendorPassword = await bcrypt.hash("saidul12345", salt);
    const customerPassword = await bcrypt.hash("hm123456", salt);

    // 1. Seed or Update Admin
    const adminEmail = (process.env.ADMIN_EMAIL || "saidulhimuu@gmail.com").toLowerCase();
    let admin = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: process.env.ADMIN_NAME || "Saidul Islam",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        subscriptionPlan: "premium",
        isBlocked: false,
        image: "/uploads/admin-profile.jpg",
      },
      { upsert: true, new: true }
    );
    console.log("Admin account configured:", admin.email);

    // 2. Seed or Update Vendor
    const vendorEmail = "saidulislam5595@gmail.com";
    let vendor = await User.findOneAndUpdate(
      { email: vendorEmail },
      {
        name: "Saidul Islam",
        email: vendorEmail,
        password: vendorPassword,
        role: "vendor",
        businessName: "Saidul Artistry & Wedding Studio",
        subscriptionPlan: "free",
        isBlocked: false,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      },
      { upsert: true, new: true }
    );
    console.log("Vendor account configured:", vendor.email);

    // 3. Seed or Update Customer
    const customerEmail = "hmcreationn@gmail.com";
    let customer = await User.findOneAndUpdate(
      { email: customerEmail },
      {
        name: "HM Creation",
        email: customerEmail,
        password: customerPassword,
        role: "customer",
        isBlocked: false,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      },
      { upsert: true, new: true }
    );
    console.log("Customer account configured:", customer.email);

    // 4. Seed Services if count < 6
    const serviceCount = await Service.countDocuments();
    if (serviceCount < 6) {
      const demoServices = [
        {
          vendorId: vendor._id,
          serviceName: "Cinematic Wedding Photography & Drone Film",
          category: "Photography & Videography",
          description: "Full day comprehensive wedding documentary coverage with 2 lead cinematographers, 4K aerial drone film, luxury heirloom album, and full high-resolution digital gallery.",
          price: 2400,
          location: "New York, NY",
          images: [
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200",
            "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200",
            "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200",
          ],
          status: "approved",
          isAvailable: true,
        },
        {
          vendorId: vendor._id,
          serviceName: "The Grand Rosewood Estate & Ballroom Venue",
          category: "Wedding Venues",
          description: "A breathtaking historic manor surrounded by 40 acres of manicured rose gardens, crystal chandeliers, grand staircases, and indoor/outdoor reception spaces accommodating up to 350 guests.",
          price: 5800,
          location: "Los Angeles, CA",
          images: [
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200",
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200",
          ],
          status: "approved",
          isAvailable: true,
        },
        {
          vendorId: vendor._id,
          serviceName: "Enchanted Garden Floral Design & Arch Styling",
          category: "Decoration & Florist",
          description: "Bespoke romantic floral installations, lush ceremony arches, cascading sweetheart table arrangements, and delicate bridal bouquets made from premium organic florals.",
          price: 1850,
          location: "Chicago, IL",
          images: [
            "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200",
            "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200",
          ],
          status: "approved",
          isAvailable: true,
        },
        {
          vendorId: vendor._id,
          serviceName: "Artisanal Gourmet 5-Course Wedding Banquet",
          category: "Catering Services",
          description: "Michelin-inspired farm-to-table culinary dining experience with bespoke menus, champagne reception, artisanal dessert bar, and dedicated executive culinary team.",
          price: 3500,
          location: "San Francisco, CA",
          images: [
            "https://images.unsplash.com/photo-1555244162-803834f70033?w=1200",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
          ],
          status: "approved",
          isAvailable: true,
        },
        {
          vendorId: vendor._id,
          serviceName: "Bridal Glow Luxury Hair & HD Airbrush Makeup",
          category: "Makeup & Styling",
          description: "Complete bridal aesthetic styling including hair preview trials, waterproof radiant airbrush makeup, luxury lashes, and on-site retouches for the entire bridal party.",
          price: 950,
          location: "Miami, FL",
          images: [
            "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200",
          ],
          status: "approved",
          isAvailable: true,
        },
        {
          vendorId: vendor._id,
          serviceName: "Haute Couture Handcrafted Bridal Gown Collection",
          category: "Wedding Fashion",
          description: "Exquisite French lace gowns, custom silk veils, and personalized fitting consultations crafted by master couturiers to ensure unforgettable bridal elegance.",
          price: 2900,
          location: "New York, NY",
          images: [
            "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=1200",
            "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200",
          ],
          status: "approved",
          isAvailable: true,
        },
      ];

      await Service.insertMany(demoServices);
      console.log(`Seeded ${demoServices.length} demo approved wedding services.`);
    }

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
