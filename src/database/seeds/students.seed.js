import { getDB } from "../../config/db.js";

export const seedStudents = async () => {
  const db = getDB();

  const getYear = () => {
    const date = new Date();
    return date.getFullYear();
  };

  const [schools] = await db.query("SELECT id FROM schools");

  if (!schools.length) {
    console.log("⚠️ No schools found.");
    return;
  }

  const schoolId = schools[0].id;

  const maleNames = [
    "Aadhavan",
    "Aakash",
    "Abhinav",
    "Ajay",
    "Akash",
    "Akilan",
    "Aravind",
    "Arjun",
    "Ashwin",
    "Bharath",
    "Charan",
    "Darshan",
    "Dhanush",
    "Dharan",
    "Dheeran",
    "Gokul",
    "Hari",
    "Harish",
    "Jeevan",
    "Kavin",
    "Kishore",
    "Lokesh",
    "Madhan",
    "Manikandan",
    "Mithun",
    "Mohan",
    "Nandhakumar",
    "Naren",
    "Naveen",
    "Pranav",
    "Praveen",
    "Rahul",
    "Rakesh",
    "Ranjith",
    "Rithvik",
    "Sanjay",
    "Saravanan",
    "Sathish",
    "Sharan",
    "Sivakumar",
    "Surya",
    "Tamilselvan",
    "Tharun",
    "Vignesh",
    "Vikram",
    "Vinoth",
    "Vishal",
    "Yogesh",
    "Yuvan",
    "Yuvaraj",
  ];
  const femaleNames = [
    "Aarthi",
    "Abinaya",
    "Ananya",
    "Anitha",
    "Anjali",
    "Aradhana",
    "Bhavani",
    "Darshini",
    "Deepika",
    "Divya",
    "Gayathri",
    "Harini",
    "Janani",
    "Keerthana",
    "Kirthika",
    "Kavya",
    "Lavanya",
    "Madhumitha",
    "Meena",
    "Monisha",
    "Nandhini",
    "Nivetha",
    "Pavithra",
    "Priya",
    "Rajalakshmi",
    "Ramya",
    "Ranjani",
    "Revathi",
    "Sangeetha",
    "Shalini",
    "Sneha",
    "Sowmya",
    "Subhashini",
    "Swathi",
    "Vaishnavi",
    "Varshini",
    "Vidhya",
    "Yazhini",
  ];

  const lastNames = [
    "Kumar",
    "Raj",
    "Murugan",
    "Selvam",
    "Babu",
    "Lakshmi",
    "Devi",
    "Priya",
    "Rani",
    "Mohan",
  ];

  for (let i = 1; i <= 50; i++) {
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    const gender = Math.random() > 0.5 ? "male" : "female";
    const firstName =
      gender === "male"
        ? maleNames[Math.floor(Math.random() * maleNames.length)]
        : femaleNames[Math.floor(Math.random() * femaleNames.length)];

    const admissionNo = `STD-${getYear()}-${String(i).padStart(4, "0")}`;

    const aadhaar = `6${String(10000000000 + i).padStart(11, "0")}`;

    const mobile = `9${String(800000000 + i).padStart(9, "0")}`;

    const parentMobile = `8${String(700000000 + i).padStart(9, "0")}`;

    const statuses = [
      "active",
      "active",
      "active",
      "active",
      "active",
      "active",
      "active",
      "graduated",
      "transferred",
      "dropped",
    ];

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const fatherOccupations = [
      "Farmer",
      "Government Employee",
      "Businessman",
      "Teacher",
      "Police Officer",
      "Electrician",
      "Engineer",
      "Driver",
      "Contractor",
      "Bank Employee",
      "Private Employee",
      "Textile Merchant",
    ];

    const motherOccupations = [
      "Homemaker",
      "Teacher",
      "Nurse",
      "Government Employee",
      "Tailor",
      "Businesswoman",
      "Private Employee",
      "Self Employed",
    ];

    const fatherOccupation =
      fatherOccupations[Math.floor(Math.random() * fatherOccupations.length)];
    const motherOccupation =
      motherOccupations[Math.floor(Math.random() * motherOccupations.length)];

    const areas = [
      "Nallampalli",
      "Pennagaram",
      "Palacode",
      "Harur",
      "Papparapatti",
      "Karimangalam",
      "Morappur",
      "Bommidi",
      "Kadathur",
      "Dharmapuri Town",
    ];

    const area = areas[Math.floor(Math.random() * areas.length)];

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const bloodGroup =
      bloodGroups[Math.floor(Math.random() * bloodGroups.length)];

    await db.query(
      `
      INSERT IGNORE INTO students (
        school_id,
        student_code,
        first_name,
        middle_name,
        last_name,
        email,
        mobile_no,
        date_of_birth,
        gender,
        blood_group,
        aadhaar_no,
        religion,
        nationality,
        mother_tongue,

        current_area,
        current_city,
        current_district,
        current_state,
        current_postal_code,
        current_address,

        current_address_same_as_permanent,
        permanent_area,
        permanent_city,
        permanent_district,
        permanent_state,
        permanent_postal_code,
        permanent_address,

        father_name,
        mother_name,
        father_occupation,
        mother_occupation,
        parent_mobile,
        alternate_mobile,
        parent_email,
        emergency_contact,
        emergency_relationship,
        status
      )
      VALUES (
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?
      )
      `,
      [
        schoolId,

        admissionNo,

        firstName,
        "",
        lastName,

        `${firstName.toLowerCase()}${i}@gmail.com`,

        mobile,

        `201${i % 10}-0${(i % 9) + 1}-15`,

        gender,

        bloodGroup,

        aadhaar,

        "Hindu",

        "INDIAN",

        "Tamil",

        area,

        "Dharmapuri",

        "Dharmapuri",

        "Tamil Nadu",

        "636701",

        `${area}, Dharmapuri`,

        true,

        "Nallampalli",

        "Dharmapuri",

        "Dharmapuri",

        "Tamil Nadu",

        "636701",

        "Nallampalli, Dharmapuri",

        `Mr. ${lastName}`,

        `Mrs. ${lastName}`,

        fatherOccupation,

        motherOccupation,

        parentMobile,

        parentMobile,

        `parent${i}@gmail.com`,

        parentMobile,

        "Father",

        status,
      ],
    );
  }

  console.log("✅ 50 students seeded");
};
