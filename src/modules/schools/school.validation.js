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
export const validateCreateSchool = (data) => {
  let {
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
    logo_url,
    website,
    status
  } = data;

  if (!name) throw { status: 400, message: "name is required" };

  // ❌ BLOCK manual code
  if (data.code) {
    throw {
      status: 400,
      message: "code is auto-generated. Do not send it"
    };
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw { status: 400, message: "Invalid email" };
  }

  if (website && !website.startsWith("http")) {
    throw { status: 400, message: "Invalid website URL" };
  }

  if (status && !["active", "inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status" };
  }

  return {
    name: name.trim(),
    email: email || null,
    phone: phone || null,
    address_line1: address_line1 || null,
    address_line2: address_line2 || null,
    city: city || null,
    district: district || null,
    state: state || null,
    country: country || "India",
    postal_code: postal_code || null,
    logo_url: logo_url || null,
    website: website || null,
    status: status || "active",
  };
};

// export const validateUpdateSchool = (data) => {
//   if (!data || Object.keys(data).length === 0) {
//     throw { status: 400, message: "No data provided" };
//   }

//   return data;
// };

export const validateUpdateSchool = (data) => {
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

    if (key === "email" && data[key]) {
      if (!/^\S+@\S+\.\S+$/.test(data[key])) {
        throw { status: 400, message: "Invalid email" };
      }
    }

    if (key === "website" && data[key]) {
      if (!data[key].startsWith("http")) {
        throw { status: 400, message: "Invalid website" };
      }
    }

    updates[key] = data[key];
  }

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: "No valid fields to update" };
  }

  return updates;
};