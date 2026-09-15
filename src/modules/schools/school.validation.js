// export const validateCreateSchool = (data) => {
//   let {
//     name,
//     code,
//     email,
//     phone,
//     city,
//     state,
//     country,
//     status
//   } = data;

//   if (!name) {
//     throw { status: 400, message: "School name is required" };
//   }

//   if (!code) {
//     throw { status: 400, message: "School code is required" };
//   }

//   if (email && !email.includes("@")) {
//     throw { status: 400, message: "Invalid email" };
//   }

//   if (phone && phone.length < 8) {
//     throw { status: 400, message: "Invalid phone" };
//   }

//   if (status && !["active", "inactive"].includes(status)) {
//     throw { status: 400, message: "Invalid status" };
//   }

//   return {
//     name: name.trim(),
//     code: code.trim(),
//     email,
//     phone,
//     city,
//     state,
//     country: country || "India",
//     status: status || "active",
//   };
// };


// export const validateCreateSchool = (data) => {
//   let {
//     name,
//     code,
//     email,
//     phone,
//     address_line1,
//     address_line2,
//     city,
//     district,
//     state,
//     country,
//     postal_code,
//     logo_url,
//     website,
//     status
//   } = data;

//   if (!name) throw { status: 400, message: "name is required" };
//   if (!code) throw { status: 400, message: "code is required" };

//   if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//     throw { status: 400, message: "Invalid email" };
//   }

//   if (website && !website.startsWith("http")) {
//     throw { status: 400, message: "Invalid website URL" };
//   }

//   if (status && !["active", "inactive"].includes(status)) {
//     throw { status: 400, message: "Invalid status" };
//   }

//   return {
//     name: name.trim(),
//     code: code.trim(),
//     email: email || null,
//     phone: phone || null,
//     address_line1: address_line1 || null,
//     address_line2: address_line2 || null,
//     city: city || null,
//     district: district || null,
//     state: state || null,
//     country: country || "India",
//     postal_code: postal_code || null,
//     logo_url: logo_url || null,
//     website: website || null,
//     status: status || "active",
//   };
// };

/* ----------- code auto generated ---------------------------*/
// export const validateCreateSchool = (data) => {
//   let {
//     name,
//     email,
//     phone,
//     address_line1,
//     address_line2,
//     city,
//     district,
//     state,
//     country,
//     postal_code,
//     logo_url,
//     website,
//     status
//   } = data;

//   if (!name) throw { status: 400, message: "name is required" };

//   // ❌ BLOCK manual code
//   if (data.code) {
//     throw {
//       status: 400,
//       message: "code is auto-generated. Do not send it"
//     };
//   }

//   if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//     throw { status: 400, message: "Invalid email" };
//   }

//   if (website && !website.startsWith("http")) {
//     throw { status: 400, message: "Invalid website URL" };
//   }

//   if (status && !["active", "inactive"].includes(status)) {
//     throw { status: 400, message: "Invalid status" };
//   }

//   return {
//     name: name.trim(),
//     email: email || null,
//     phone: phone || null,
//     address_line1: address_line1 || null,
//     address_line2: address_line2 || null,
//     city: city || null,
//     district: district || null,
//     state: state || null,
//     country: country || "India",
//     postal_code: postal_code || null,
//     logo_url: logo_url || null,
//     website: website || null,
//     status: status || "active",
//   };
// };

// export const validateUpdateSchool = (data) => {
//   if (!data || Object.keys(data).length === 0) {
//     throw { status: 400, message: "No data provided" };
//   }

//   return data;
// };


/* =============== logo file upload ==========================*/
const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return value;
  return value.trim() || null;
};

export const validateCreateSchool = (data = {}) => {
  const {
    name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    district,
    state,
    country,
    postal_code,
    website,
    status,
  } = data;

  if (typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "School name is required" };
  }

  if (data.code && String(data.code).trim()) {
    throw { status: 400, message: "code is auto-generated" };
  }

  if (email && typeof email !== "string") {
    throw { status: 400, message: "Invalid email" };
  }

  if (email?.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw { status: 400, message: "Invalid email" };
  }

  if (website && typeof website !== "string") {
    throw { status: 400, message: "Invalid website URL" };
  }

  if (website?.trim() && !/^https?:\/\//i.test(website.trim())) {
    throw { status: 400, message: "Invalid website URL" };
  }

  if (status && !["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    throw { status: 400, message: "Invalid phone" };
  }

  return {
    name: name.trim(),
    email: trimOrNull(email),
    phone: trimOrNull(phone),
    address_line1: trimOrNull(address_line1),
    address_line2: trimOrNull(address_line2),
    city: trimOrNull(city),
    district: trimOrNull(district),
    state: trimOrNull(state),
    country: trimOrNull(country) || "India",
    postal_code: trimOrNull(postal_code),
    website: trimOrNull(website),
    status: status || "active",
  };
};

export const validateUpdateSchool = (data = {}) => {
  const allowedFields = [
    "name",
    "email",
    "phone",
    "address_line1",
    "address_line2",
    "city",
    "district",
    "state",
    "country",
    "postal_code",
    "logo_url",
    "website",
    "status"
  ];

  const updates = {};

  for (const key of Object.keys(data)) {
    if (!allowedFields.includes(key)) continue;

    const val = typeof data[key] === "string" ? data[key].trim() : data[key];

    if (
      ["name", "email", "phone", "address_line1", "address_line2", "city", "district", "state", "country", "postal_code", "website", "status"].includes(key) &&
      val !== null &&
      val !== undefined &&
      typeof val !== "string"
    ) {
      throw { status: 400, message: `Invalid ${key}` };
    }

    if (key === "name") {
      if (!val) throw { status: 400, message: "School name is required" };
      updates[key] = val;
      continue;
    }

    if (key === "email" && val) {
      if (!/^\S+@\S+\.\S+$/.test(val)) {
        throw { status: 400, message: "Invalid email" };
      }
    }

    if (key === "website" && val) {
      if (!/^https?:\/\//i.test(val)) {
        throw { status: 400, message: "Invalid website URL" };
      }
    }

    if (key === "status" && val) {
      if (!["active", "inactive"].includes(val)) {
        throw { status: 400, message: "Invalid status" };
      }
    }

    updates[key] = val === "" ? null : val;
  }

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: "No valid fields to update" };
  }

  return updates;
};