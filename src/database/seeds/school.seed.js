import { getDB } from "../../config/db.js";

export const seedSchools = async () => {
  const db = getDB();

  const schools = [
    // {
    //   name: "ABC Matric Higher Secondary School",
    //   code: "ABC001",
    //   email: "info@abcschool.edu.in",
    //   phone: "04522345678",
    //   address_line1: "No. 15, Anna Nagar Main Road",
    //   address_line2: "Near Bus Stand",
    //   city: "Madurai",
    //   district: "Madurai",
    //   state: "Tamil Nadu",
    //   country: "India",
    //   postal_code: "625020",
    //   logo_url: "/uploads/schools/default-school-logo.png",
    //   website: "https://www.abcschool.edu.in",
    // },
    // {
    //   name: "Bright Future Public School",
    //   code: "BFS001",
    //   email: "contact@brightfuture.edu.in",
    //   phone: "04422334455",
    //   address_line1: "12 Gandhi Street",
    //   address_line2: "Central Area",
    //   city: "Chennai",
    //   district: "Chennai",
    //   state: "Tamil Nadu",
    //   country: "India",
    //   postal_code: "600001",
    //   logo_url: "/uploads/schools/default-school-logo.png",
    //   website: "https://www.brightfuture.edu.in",
    // },
    {
      name: "Green Valley International School",
      code: "GVIS001",
      email: "admin@gvis.edu.in",
      phone: "04224567890",
      address_line1: "45 Avinashi Road",
      address_line2: "Peelamedu",
      city: "Coimbatore",
      district: "Coimbatore",
      state: "Tamil Nadu",
      country: "India",
      postal_code: "641018",
      logo_url: "/uploads/schools/default-school-logo.png",
      website: "https://www.gvis.edu.in",
    },
  ];

  for (const school of schools) {
    await db.query(
      `
      INSERT IGNORE INTO schools (
        name,
        code,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        district,
        state,
        country,
        postal_code,
        logo_url,
        website
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        school.name,
        school.code,
        school.email,
        school.phone,
        school.address_line1,
        school.address_line2,
        school.city,
        school.district,
        school.state,
        school.country,
        school.postal_code,
        school.logo_url,
        school.website,
      ]
    );
  }

  console.log("✅ Schools seeded successfully");
};