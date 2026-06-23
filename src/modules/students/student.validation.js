export const validateCreateStudent = (data) => {
  let {
    school_id,
    admission_no,

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

    permanent_address,
    permanent_area,
    permanent_city,
    permanent_district,
    permanent_state,
    permanent_postal_code,

    father_name,
    mother_name,
    father_occupation,
    mother_occupation,

    parent_mobile,
    alternate_mobile,
    parent_email,

    emergency_contact,
    emergency_relationship,

    allergies,
    chronic_conditions,

    status,
  } = data;

  /* =====================================
     🔴 REQUIRED
  ===================================== */
  if (!school_id) throw { status: 400, message: "school_id is required" };
  if (!first_name) throw { status: 400, message: "first_name is required" };

  /* =====================================
     🔴 STRING CLEANING
  ===================================== */
  school_id = Number(school_id);
  first_name = first_name.trim();
  middle_name = middle_name?.trim() || null;
  last_name = last_name?.trim() || null;

  email = email?.trim().toLowerCase() || null;
  mobile_no = mobile_no?.trim() || null;

  date_of_birth = date_of_birth?.trim() || null;
  gender = gender?.trim() || null;

  blood_group = blood_group?.trim().toUpperCase() || null;
  aadhaar_no = aadhaar_no?.trim() || null;

  religion = religion?.trim().toUpperCase() || null;
  nationality = nationality?.trim().toUpperCase() || null;
  mother_tongue = mother_tongue?.trim().toUpperCase() || null;

  current_area = current_area?.trim() || null;
  current_city = current_city?.trim() || null;
  current_district = current_district?.trim() || null;
  current_state = current_state?.trim() || null;
  current_postal_code = current_postal_code?.trim() || null;
  current_address = current_address?.trim() || null;

  permanent_address = permanent_address?.trim() || null;
  permanent_area = permanent_area?.trim() || null;
  permanent_city = permanent_city?.trim() || null;
  permanent_district = permanent_district?.trim() || null;
  permanent_state = permanent_state?.trim() || null;
  permanent_postal_code = permanent_postal_code?.trim() || null;

  father_name = father_name?.trim() || null;
  mother_name = mother_name?.trim() || null;
  father_occupation = father_occupation?.trim() || null;
  mother_occupation = mother_occupation?.trim() || null;

  parent_mobile = parent_mobile?.trim() || null;
  alternate_mobile = alternate_mobile?.trim() || null;
  parent_email = parent_email?.trim().toLowerCase() || null;

  emergency_contact = emergency_contact?.trim() || null;
  emergency_relationship = emergency_relationship?.trim().toUpperCase() || null;

  allergies = allergies?.trim() || null;
  chronic_conditions = chronic_conditions?.trim() || null;

  /* =====================================
     🔴 EMAIL VALIDATION
  ===================================== */
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw { status: 400, message: "Invalid email format" };
  }

  if (parent_email && !/^\S+@\S+\.\S+$/.test(parent_email)) {
    throw { status: 400, message: "Invalid parent email" };
  }

  /* =====================================
     🔴 MOBILE VALIDATION (INDIA)
  ===================================== */
  const mobileRegex = /^[6-9]\d{9}$/;

  if (mobile_no && !mobileRegex.test(mobile_no)) {
    throw { status: 400, message: "Invalid student mobile number" };
  }

  if (parent_mobile && !mobileRegex.test(parent_mobile)) {
    throw { status: 400, message: "Invalid parent mobile number" };
  }

  if (alternate_mobile && !mobileRegex.test(alternate_mobile)) {
    throw { status: 400, message: "Invalid alternate mobile number" };
  }

  if (emergency_contact && !mobileRegex.test(emergency_contact)) {
    throw { status: 400, message: "Invalid emergency contact" };
  }

  /* =====================================
     🔴 DATE OF BIRTH
  ===================================== */
  if (date_of_birth) {
    const dob = new Date(date_of_birth);
    if (isNaN(dob)) {
      throw { status: 400, message: "Invalid date_of_birth" };
    }

    if (dob > new Date()) {
      throw { status: 400, message: "DOB cannot be future date" };
    }
  }

  /* =====================================
     🔴 ENUM VALIDATION
  ===================================== */
  if (gender && !["male", "female", "other"].includes(gender)) {
    throw { status: 400, message: "Invalid gender" };
  }

  if (
    status &&
    !["active", "graduated", "transferred", "dropped"].includes(status)
  ) {
    throw { status: 400, message: "Invalid status" };
  }

  /* =====================================
     🔴 AADHAAR VALIDATION
  ===================================== */
  if (aadhaar_no && !/^\d{12}$/.test(aadhaar_no)) {
    throw { status: 400, message: "Invalid Aadhaar number" };
  }

  /* =====================================
     🔴 POSTAL CODE
  ===================================== */
  if (current_postal_code && !/^\d{6}$/.test(current_postal_code)) {
    throw { status: 400, message: "Invalid current postal code" };
  }

  if (permanent_postal_code && !/^\d{6}$/.test(permanent_postal_code)) {
    throw { status: 400, message: "Invalid permanent postal code" };
  }

  /* =====================================
     🔴 BOOLEAN NORMALIZATION
  ===================================== */
  current_address_same_as_permanent =
    current_address_same_as_permanent === true ||
    current_address_same_as_permanent === "true";

  /* =====================================
     🔴 DEFAULTS
  ===================================== */
  nationality = nationality || "INDIAN";
  status = status || "active";

  /* =====================================
     🔴 FINAL OBJECT
  ===================================== */
  return {
    school_id,
    admission_no: admission_no || null,

    first_name,
    middle_name,
    last_name,

    email: email || null,
    mobile_no: mobile_no || null,

    date_of_birth: date_of_birth || null,
    gender: gender || null,

    blood_group: blood_group || null,
    aadhaar_no: aadhaar_no || null,

    religion: religion || null,
    nationality,
    mother_tongue: mother_tongue || null,

    current_area: current_area || null,
    current_city: current_city || null,
    current_district: current_district || null,
    current_state: current_state || null,
    current_postal_code: current_postal_code || null,
    current_address: current_address || null,

    current_address_same_as_permanent,

    permanent_address: permanent_address || null,
    permanent_area: permanent_area || null,
    permanent_city: permanent_city || null,
    permanent_district: permanent_district || null,
    permanent_state: permanent_state || null,
    permanent_postal_code: permanent_postal_code || null,

    father_name: father_name || null,
    mother_name: mother_name || null,
    father_occupation: father_occupation || null,
    mother_occupation: mother_occupation || null,

    parent_mobile: parent_mobile || null,
    alternate_mobile: alternate_mobile || null,
    parent_email: parent_email || null,

    emergency_contact: emergency_contact || null,
    emergency_relationship: emergency_relationship || null,

    allergies: allergies || null,
    chronic_conditions: chronic_conditions || null,

    status,
  };
};

// export const validateUpdateStudent = (data) => {
//   if (!data || Object.keys(data).length === 0) {
//     throw { status: 400, message: "No data provided for update" };
//   }

//   let updated = {};

//   // =============================
//   // 🔴 STRING FIELDS
//   // =============================

//   if (data.first_name !== undefined) {
//     if (!data.first_name.trim()) {
//       throw { status: 400, message: "first_name cannot be empty" };
//     }
//     updated.first_name = data.first_name.trim();
//   }

//   if (data.middle_name !== undefined) {
//     updated.middle_name = data.middle_name?.trim() || null;
//   }

//   if (data.last_name !== undefined) {
//     updated.last_name = data.last_name?.trim() || null;
//   }

//   // =============================
//   // 🔴 EMAIL
//   // =============================

//   if (data.email !== undefined) {
//     if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
//       throw { status: 400, message: "Invalid email" };
//     }
//     updated.email = data.email?.trim().toLowerCase() || null;
//   }

//   if (data.parent_email !== undefined) {
//     if (data.parent_email && !/^\S+@\S+\.\S+$/.test(data.parent_email)) {
//       throw { status: 400, message: "Invalid parent email" };
//     }
//     updated.parent_email = data.parent_email?.trim().toLowerCase() || null;
//   }

//   // =============================
//   // 🔴 MOBILE VALIDATION
//   // =============================

//   const mobileRegex = /^[6-9]\d{9}$/;

//   const validateMobile = (value, field) => {
//     if (value && !mobileRegex.test(value)) {
//       throw { status: 400, message: `Invalid ${field}` };
//     }
//     return value?.trim() || null;
//   };

//   if (data.mobile_no !== undefined) {
//     updated.mobile_no = validateMobile(data.mobile_no, "mobile_no");
//   }

//   if (data.parent_mobile !== undefined) {
//     updated.parent_mobile = validateMobile(data.parent_mobile, "parent_mobile");
//   }

//   if (data.alternate_mobile !== undefined) {
//     updated.alternate_mobile = validateMobile(data.alternate_mobile, "alternate_mobile");
//   }

//   if (data.emergency_contact !== undefined) {
//     updated.emergency_contact = validateMobile(data.emergency_contact, "emergency_contact");
//   }

//   // =============================
//   // 🔴 DOB
//   // =============================

//   if (data.date_of_birth !== undefined) {
//     const dob = new Date(data.date_of_birth);
//     if (isNaN(dob)) {
//       throw { status: 400, message: "Invalid date_of_birth" };
//     }
//     if (dob > new Date()) {
//       throw { status: 400, message: "DOB cannot be future date" };
//     }
//     updated.date_of_birth = data.date_of_birth;
//   }

//   // =============================
//   // 🔴 ENUM
//   // =============================

//   if (data.gender !== undefined) {
//     if (!["male", "female", "other"].includes(data.gender)) {
//       throw { status: 400, message: "Invalid gender" };
//     }
//     updated.gender = data.gender;
//   }

//   if (data.status !== undefined) {
//     if (!["active", "graduated", "transferred", "dropped"].includes(data.status)) {
//       throw { status: 400, message: "Invalid status" };
//     }
//     updated.status = data.status;
//   }

//   // =============================
//   // 🔴 AADHAAR
//   // =============================

//   if (data.aadhaar_no !== undefined) {
//     if (data.aadhaar_no && !/^\d{12}$/.test(data.aadhaar_no)) {
//       throw { status: 400, message: "Invalid Aadhaar number" };
//     }
//     updated.aadhaar_no = data.aadhaar_no?.trim() || null;
//   }

//   // =============================
//   // 🔴 POSTAL CODE
//   // =============================

//   if (data.current_postal_code !== undefined) {
//     if (data.current_postal_code && !/^\d{6}$/.test(data.current_postal_code)) {
//       throw { status: 400, message: "Invalid current postal code" };
//     }
//     updated.current_postal_code = data.current_postal_code;
//   }

//   if (data.permanent_postal_code !== undefined) {
//     if (data.permanent_postal_code && !/^\d{6}$/.test(data.permanent_postal_code)) {
//       throw { status: 400, message: "Invalid permanent postal code" };
//     }
//     updated.permanent_postal_code = data.permanent_postal_code;
//   }

//   // =============================
//   // 🔴 BOOLEAN
//   // =============================

//   if (data.current_address_same_as_permanent !== undefined) {
//     updated.current_address_same_as_permanent =
//       data.current_address_same_as_permanent === true ||
//       data.current_address_same_as_permanent === "true";
//   }

//   // =============================
//   // 🔴 SIMPLE PASS FIELDS
//   // =============================

//   const passFields = [
//     "blood_group",
//     "religion",
//     "nationality",
//     "mother_tongue",
//     "current_area",
//     "current_city",
//     "current_district",
//     "current_state",
//     "current_address",
//     "permanent_address",
//     "permanent_area",
//     "permanent_city",
//     "permanent_district",
//     "permanent_state",
//     "father_name",
//     "mother_name",
//     "father_occupation",
//     "mother_occupation",
//     "emergency_relationship",
//     "allergies",
//     "chronic_conditions",
//   ];

//   passFields.forEach((field) => {
//     if (data[field] !== undefined) {
//       updated[field] = data[field]?.trim() || null;
//     }
//   });

//   return updated;
// };

export const validateUpdateStudent = (data) => {
  let {
    school_id,
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
    permanent_address,
    permanent_area,
    permanent_city,
    permanent_district,
    permanent_state,
    permanent_postal_code,
    father_name,
    mother_name,
    father_occupation,
    mother_occupation,
    parent_mobile,
    alternate_mobile,
    parent_email,
    emergency_contact,
    emergency_relationship,
    allergies,
    chronic_conditions,
    status,
  } = data;

  const cleaned = {};

  /* =====================================
     🔴 STRING CLEANING (ONLY IF EXISTS)
  ===================================== */

  if (school_id) cleaned.school_id = Number(school_id);

  if (first_name) cleaned.first_name = first_name.trim();
  if (middle_name !== undefined)
    cleaned.middle_name = middle_name?.trim() || null;
  if (last_name !== undefined) cleaned.last_name = last_name?.trim() || null;

  if (email !== undefined) {
    const val = email?.trim().toLowerCase();
    if (val && !/^\S+@\S+\.\S+$/.test(val)) {
      throw { status: 400, message: "Invalid email" };
    }
    cleaned.email = val || null;
  }

  if (mobile_no !== undefined) {
    const val = mobile_no?.trim();
    if (val && !/^[6-9]\d{9}$/.test(val)) {
      throw { status: 400, message: "Invalid mobile number" };
    }
    cleaned.mobile_no = val || null;
  }

  if (date_of_birth !== undefined) {
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      if (isNaN(dob)) {
        throw { status: 400, message: "Invalid DOB" };
      }
      if (dob > new Date()) {
        throw { status: 400, message: "DOB cannot be future" };
      }
    }
    cleaned.date_of_birth = date_of_birth || null;
  }

  if (gender !== undefined) {
    if (gender && !["male", "female", "other"].includes(gender)) {
      throw { status: 400, message: "Invalid gender" };
    }
    cleaned.gender = gender || null;
  }

  if (blood_group !== undefined) {
    cleaned.blood_group = blood_group?.trim().toUpperCase() || null;
  }

  if (aadhaar_no !== undefined) {
    if (aadhaar_no && !/^\d{12}$/.test(aadhaar_no)) {
      throw { status: 400, message: "Invalid Aadhaar" };
    }
    cleaned.aadhaar_no = aadhaar_no || null;
  }

  if (current_postal_code !== undefined) {
    if (current_postal_code && !/^\d{6}$/.test(current_postal_code)) {
      throw { status: 400, message: "Invalid postal code" };
    }
    cleaned.current_postal_code = current_postal_code || null;
  }

  if (permanent_postal_code !== undefined) {
    if (permanent_postal_code && !/^\d{6}$/.test(permanent_postal_code)) {
      throw { status: 400, message: "Invalid postal code" };
    }
    cleaned.permanent_postal_code = permanent_postal_code || null;
  }

  if (parent_mobile !== undefined) {
    const val = parent_mobile?.trim();
    if (val && !/^[6-9]\d{9}$/.test(val)) {
      throw { status: 400, message: "Invalid parent mobile" };
    }
    cleaned.parent_mobile = val || null;
  }

  if (alternate_mobile !== undefined) {
    const val = alternate_mobile?.trim();
    if (val && !/^[6-9]\d{9}$/.test(val)) {
      throw { status: 400, message: "Invalid alternate mobile" };
    }
    cleaned.alternate_mobile = val || null;
  }

  if (parent_email !== undefined) {
    const val = parent_email?.trim().toLowerCase();
    if (val && !/^\S+@\S+\.\S+$/.test(val)) {
      throw { status: 400, message: "Invalid parent email" };
    }
    cleaned.parent_email = val || null;
  }

  if (status !== undefined) {
    if (!["active", "graduated", "transferred", "dropped"].includes(status)) {
      throw { status: 400, message: "Invalid status" };
    }
    cleaned.status = status;
  }

  /* =====================================
     🔴 SIMPLE FIELDS
  ===================================== */

  [
    "religion",
    "nationality",
    "mother_tongue",
    "current_area",
    "current_city",
    "current_district",
    "current_state",
    "current_address",
    "permanent_address",
    "permanent_area",
    "permanent_city",
    "permanent_district",
    "permanent_state",
    "father_name",
    "mother_name",
    "father_occupation",
    "mother_occupation",
    "emergency_contact",
    "emergency_relationship",
    "allergies",
    "chronic_conditions",
  ].forEach((field) => {
    if (data[field] !== undefined) {
      cleaned[field] = data[field]?.trim() || null;
    }
  });

  /* =====================================
     🔴 BOOLEAN
  ===================================== */
  if (current_address_same_as_permanent !== undefined) {
    cleaned.current_address_same_as_permanent =
      current_address_same_as_permanent === true ||
      current_address_same_as_permanent === "true";
  }

  if (religion !== undefined) {
    cleaned.religion = religion?.trim().toUpperCase() || null;
  }

  if (nationality !== undefined) {
    cleaned.nationality = nationality?.trim().toUpperCase() || null;
  }

  if (mother_tongue !== undefined) {
    cleaned.mother_tongue = mother_tongue?.trim().toUpperCase() || null;
  }

  if(emergency_relationship !== undefined){
    cleaned.emergency_relationship = emergency_relationship?.trim().toUpperCase() || null;
  }


  return cleaned;
};
