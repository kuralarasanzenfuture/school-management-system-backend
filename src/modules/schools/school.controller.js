import * as SchoolService from "./school.service.js";

// export const createSchool = async (req, res) => {
//   try {
//     const result = await SchoolService.createSchool(req.body);
//     res.status(201).json(result);
//   } catch (err) {
//     res.status(err.status || 500).json({ message: err.message });
//   }
// };

export const createSchool = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files?.logo) {
      data.logo_url = `/uploads/schools/logos/${req.files.logo[0].filename}`;
    }

    const result = await SchoolService.createSchool(data);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSchools = async (req, res) => {
  try {
    const data = await SchoolService.getAllSchools();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllSchoolsByToken = async (req, res) => {
  try {
    const data = await SchoolService.getAllSchoolsByToken(req.user);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export const getSchoolById = async (req, res) => {
  try {
    const data = await SchoolService.getSchoolById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// export const updateSchool = async (req, res) => {
//   try {
//     const result = await SchoolService.updateSchool(req.params.id, req.body);
//     res.json(result);
//   } catch (err) {
//     res.status(err.status || 500).json({ message: err.message });
//   }
// };

export const updateSchool = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files?.logo) {
      data.logo_url = `/uploads/schools/logos/${req.files.logo[0].filename}`;
    }

    const result = await SchoolService.updateSchool(req.params.id, data);

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const result = await SchoolService.deleteSchool(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
