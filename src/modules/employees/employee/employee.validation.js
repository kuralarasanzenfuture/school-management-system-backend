const toUpper = (val) =>
  typeof val === "string" ? val.trim().toUpperCase() : null;

const toLower = (val) =>
  typeof val === "string" ? val.trim().toLowerCase() : null;

const toNull = (val) => (val === undefined || val === "" ? null : val);

const toBool = (val) => {
  if (val === true || val === "true" || val === 1 || val === "1") return true;
  if (val === false || val === "false" || val === 0 || val === "0")
    return false;
  return false;
};

export const validateCreateEmployee = (data) => {
  let {
    school_id,
    first_name,
    last_name,
    email,
    mobile,
    gender,
    dob,
    blood_group,
    aadhaar_no,
    joining_date,
    designation,
    department,
    qualification,
    experience_years,
    salary,

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

    emergency_contact,
    emergency_relationship,

    bank_name,
    branch_name,
    account_number,
    account_type,
    ifsc_code,

    status,
  } = data;

  /* REQUIRED */
  if (!school_id) throw { status: 400, message: "school_id required" };
  if (!first_name) throw { status: 400, message: "first_name required" };
  if (!mobile) throw { status: 400, message: "mobile required" };
  if (!joining_date) throw { status: 400, message: "joining_date required" };
  if (!designation) throw { status: 400, message: "designation required" };

  /* MOBILE */
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw { status: 400, message: "Invalid mobile" };
  }

  /* EMAIL */
  email = toLower(email);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw { status: 400, message: "Invalid email" };
  }

  /* IFSC */
  ifsc_code = toUpper(ifsc_code);
  if (ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) {
    throw { status: 400, message: "Invalid IFSC code" };
  }

  /* RELATION */
  const relations = [
    "wife",
    "husband",
    "son",
    "daughter",
    "friend",
    "relative",
    "father",
    "mother",
    "other",
  ];

  if (
    emergency_relationship &&
    !relations.includes(emergency_relationship.toLowerCase())
  ) {
    throw { status: 400, message: "Invalid emergency relationship" };
  }

  return {
    school_id: Number(school_id),

    first_name: first_name.trim(),
    last_name: toNull(last_name?.trim()),

    email,
    mobile,

    gender: toLower(gender),
    dob: toNull(dob),

    blood_group: toUpper(blood_group),
    aadhaar_no: toNull(aadhaar_no),

    joining_date,

    designation: toUpper(designation),
    department: toUpper(department),
    qualification: toUpper(qualification),

    experience_years: toNull(experience_years),
    salary: toNull(salary),

    /* ADDRESS */
    current_area: toNull(current_area),
    current_city: toNull(current_city),
    current_district: toNull(current_district),
    current_state: toNull(current_state),
    current_postal_code: toNull(current_postal_code),
    current_address: toNull(current_address),

    current_address_same_as_permanent: toBool(
      current_address_same_as_permanent,
    ),

    permanent_address: toNull(permanent_address),
    permanent_area: toNull(permanent_area),
    permanent_city: toNull(permanent_city),
    permanent_district: toNull(permanent_district),
    permanent_state: toNull(permanent_state),
    permanent_postal_code: toNull(permanent_postal_code),

    /* EMERGENCY */
    emergency_contact: toNull(emergency_contact),
    emergency_relationship: toLower(emergency_relationship),

    /* BANK */
    bank_name: toUpper(bank_name),
    branch_name: toUpper(branch_name),
    account_number: toNull(account_number),
    account_type: toUpper(account_type),
    ifsc_code,

    status: status?.toLowerCase() || "active",
  };
};

export const validateUpdateEmployee = (data) => {
  const cleaned = {};

  if (data.first_name !== undefined)
    cleaned.first_name = data.first_name.trim();

  if (data.last_name !== undefined)
    cleaned.last_name = toNull(data.last_name?.trim());

  if (data.email !== undefined) {
    const email = toLower(data.email);
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      throw { status: 400, message: "Invalid email" };
    }
    cleaned.email = email;
  }

  if (data.mobile !== undefined) {
    if (!/^[6-9]\d{9}$/.test(data.mobile)) {
      throw { status: 400, message: "Invalid mobile" };
    }
    cleaned.mobile = data.mobile;
  }

  if (data.designation !== undefined)
    cleaned.designation = toUpper(data.designation);

  if (data.department !== undefined)
    cleaned.department = toUpper(data.department);

  if (data.qualification !== undefined)
    cleaned.qualification = toUpper(data.qualification);

  if (data.salary !== undefined) cleaned.salary = toNull(data.salary);

  if (data.status !== undefined) {
    const status = data.status.toLowerCase();
    if (!["active", "inactive"].includes(status)) {
      throw { status: 400, message: "Invalid status" };
    }
    cleaned.status = status;
  }

  if (data.current_address_same_as_permanent !== undefined) {
    cleaned.current_address_same_as_permanent = toBool(
      data.current_address_same_as_permanent,
    );
  }

  if (Object.keys(cleaned).length === 0) {
    throw { status: 400, message: "Nothing to update" };
  }

  return cleaned;
};

// export const validateCreateEmployee = (data) => {
//   let {
//     school_id,
//     first_name,
//     last_name,
//     email,
//     mobile,
//     gender,
//     dob,
//     blood_group,
//     aadhaar_no,
//     joining_date,
//     designation,
//     department,
//     qualification,
//     experience_years,
//     salary,

//     current_area,
//     current_city,
//     current_district,
//     current_state,
//     current_postal_code,
//     current_address,
//     current_address_same_as_permanent,

//     permanent_address,
//     permanent_area,
//     permanent_city,
//     permanent_district,
//     permanent_state,
//     permanent_postal_code,

//     emergency_contact,
//     emergency_relationship,

//     bank_name,
//     branch_name,
//     account_number,
//     account_type,
//     ifsc_code,

//     status,
//   } = data;

//   /* REQUIRED */
//   if (!school_id) throw { status: 400, message: "school_id required" };
//   if (!first_name) throw { status: 400, message: "first_name required" };
//   if (!mobile) throw { status: 400, message: "mobile required" };
//   if (!joining_date) throw { status: 400, message: "joining_date required" };
//   if (!designation) throw { status: 400, message: "designation required" };

//   /* MOBILE */
//   if (!/^[6-9]\d{9}$/.test(mobile)) {
//     throw { status: 400, message: "Invalid mobile" };
//   }

//   /* EMAIL */
//   if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//     throw { status: 400, message: "Invalid email" };
//   }

//   /* IFSC */
//   if (ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) {
//     throw { status: 400, message: "Invalid IFSC code" };
//   }

//   /* RELATION ENUM */
//   const relations = [
//     "wife","husband","son","daughter","friend",
//     "relative","father","mother","other"
//   ];

//   if (emergency_relationship && !relations.includes(emergency_relationship)) {
//     throw { status: 400, message: "Invalid emergency relationship" };
//   }

//   email = email?.toLowerCase() || null;
//   blood_group = blood_group?.toUpperCase() || null;
//   designation = designation?.toUpperCase() || null;
//   department = department?.toUpperCase() || null;
//   qualification = qualification?.toUpperCase() || null;
//   account_type = account_type?.toUpperCase() || null;

//   bank_name = bank_name?.toUpperCase() || null;
//   branch_name = branch_name?.toUpperCase() || null;
//   account_type = account_type?.toUpperCase() || null;
//   ifsc_code = ifsc_code?.toUpperCase() || null;

//   return {
//     school_id: Number(school_id),

//     first_name: first_name.trim(),
//     last_name: last_name?.trim() || null,

//     email: email?.toLowerCase() || null,
//     mobile,

//     gender: gender || null,
//     dob: dob || null,

//     blood_group: blood_group || null,
//     aadhaar_no: aadhaar_no || null,

//     joining_date,

//     designation: designation.toUpperCase(),
//     department: department || null,
//     qualification: qualification || null,

//     experience_years: experience_years || null,
//     salary: salary || null,

//     /* ADDRESS */
//     current_area: current_area || null,
//     current_city: current_city || null,
//     current_district: current_district || null,
//     current_state: current_state || null,
//     current_postal_code: current_postal_code || null,
//     current_address: current_address || null,

//     current_address_same_as_permanent:
//       current_address_same_as_permanent === true ||
//       current_address_same_as_permanent === "true",

//     permanent_address: permanent_address || null,
//     permanent_area: permanent_area || null,
//     permanent_city: permanent_city || null,
//     permanent_district: permanent_district || null,
//     permanent_state: permanent_state || null,
//     permanent_postal_code: permanent_postal_code || null,

//     /* EMERGENCY */
//     emergency_contact: emergency_contact || null,
//     emergency_relationship: emergency_relationship || null,

//     /* BANK */
//     bank_name: bank_name || null,
//     branch_name: branch_name || null,
//     account_number: account_number || null,
//     account_type: account_type || null,
//     ifsc_code: ifsc_code || null,

//     status: status || "active",
//   };
// };

// export const validateUpdateEmployee = (data) => {
//   const cleaned = {};

//   if (data.first_name !== undefined)
//     cleaned.first_name = data.first_name.trim();

//   if (data.last_name !== undefined)
//     cleaned.last_name = data.last_name?.trim() || null;

//   if (data.email !== undefined)
//     cleaned.email = data.email?.toLowerCase() || null;

//   if (data.mobile !== undefined)
//     cleaned.mobile = data.mobile;

//   if (data.designation !== undefined)
//     cleaned.designation = data.designation.toUpperCase();

//   if (data.salary !== undefined)
//     cleaned.salary = data.salary;

//   if (data.status !== undefined)
//     cleaned.status = data.status;

//   return cleaned;
// };
