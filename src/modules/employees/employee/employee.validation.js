
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
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw { status: 400, message: "Invalid email" };
  }

  /* IFSC */
  if (ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) {
    throw { status: 400, message: "Invalid IFSC code" };
  }

  /* RELATION ENUM */
  const relations = [
    "wife","husband","son","daughter","friend",
    "relative","father","mother","other"
  ];

  if (emergency_relationship && !relations.includes(emergency_relationship)) {
    throw { status: 400, message: "Invalid emergency relationship" };
  }

  return {
    school_id: Number(school_id),

    first_name: first_name.trim(),
    last_name: last_name?.trim() || null,

    email: email?.toLowerCase() || null,
    mobile,

    gender: gender || null,
    dob: dob || null,

    blood_group: blood_group || null,
    aadhaar_no: aadhaar_no || null,

    joining_date,

    designation: designation.toUpperCase(),
    department: department || null,
    qualification: qualification || null,

    experience_years: experience_years || null,
    salary: salary || null,

    /* ADDRESS */
    current_area: current_area || null,
    current_city: current_city || null,
    current_district: current_district || null,
    current_state: current_state || null,
    current_postal_code: current_postal_code || null,
    current_address: current_address || null,

    current_address_same_as_permanent:
      current_address_same_as_permanent === true ||
      current_address_same_as_permanent === "true",

    permanent_address: permanent_address || null,
    permanent_area: permanent_area || null,
    permanent_city: permanent_city || null,
    permanent_district: permanent_district || null,
    permanent_state: permanent_state || null,
    permanent_postal_code: permanent_postal_code || null,

    /* EMERGENCY */
    emergency_contact: emergency_contact || null,
    emergency_relationship: emergency_relationship || null,

    /* BANK */
    bank_name: bank_name || null,
    branch_name: branch_name || null,
    account_number: account_number || null,
    account_type: account_type || null,
    ifsc_code: ifsc_code || null,

    status: status || "active",
  };
};

export const validateUpdateEmployee = (data) => {
  const cleaned = {};

  if (data.first_name !== undefined)
    cleaned.first_name = data.first_name.trim();

  if (data.last_name !== undefined)
    cleaned.last_name = data.last_name?.trim() || null;

  if (data.email !== undefined)
    cleaned.email = data.email?.toLowerCase() || null;

  if (data.mobile !== undefined)
    cleaned.mobile = data.mobile;

  if (data.designation !== undefined)
    cleaned.designation = data.designation.toUpperCase();

  if (data.salary !== undefined)
    cleaned.salary = data.salary;

  if (data.status !== undefined)
    cleaned.status = data.status;

  return cleaned;
};