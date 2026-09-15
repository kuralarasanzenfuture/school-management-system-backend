import * as SchoolService from "./school.service.js";
import { deleteSchoolFile } from "../../middlewares/school.upload.js";

export const createSchool = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.files?.logo?.[0]) {
      data.logo_url = `/uploads/schools/logos/${req.files.logo[0].filename}`;
    }

    const result = await SchoolService.createSchool(data, req);

    res.json(result);
  } catch (err) {
    if (req.files?.logo?.[0]?.path) {
      deleteSchoolFile(req.files.logo[0].path);
    }
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSchools = async (req, res) => {
  try {
    const data = await SchoolService.getAllSchools(req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllSchoolsByToken = async (req, res) => {
  try {
    const data = await SchoolService.getAllSchoolsByToken(req.user, req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const data = await SchoolService.getSchoolById(req.params.id, req);
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

    if (req.files?.logo?.[0]) {
      data.logo_url = `/uploads/schools/logos/${req.files.logo[0].filename}`;
    } else if (req.body.remove_logo === "true" || req.body.remove_logo === true) {
      data.remove_logo = true;
      data.logo_url = null;
    }

    const result = await SchoolService.updateSchool(req.params.id, data, req);

    res.json(result);

  } catch (err) {
    if (req.files?.logo?.[0]?.path) {
      deleteSchoolFile(req.files.logo[0].path);
    }
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
