import * as SectionService from "./section.service.js";

export const createSection = async (req, res) => {
  try {
    const result = await SectionService.createSection(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const result = await SectionService.updateSection(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// export const getAllSections = async (req, res) => {
//   try {
//     const data = await SectionService.getAllSections();
//     res.json(data);
//   } catch (err) {
//     res.status(err.status || 500).json({ message: err.message });
//   }
// };

export const getAllSections = async (req, res) => {
  try {
    // const data = await SectionService.getAllSections({
    //   class_id: req.query.class_id,
    //   school_id: req.query.school_id,
    // });

    const { class_id, school_id } = req.query;

    const data = await SectionService.getAllSections({
      class_id,
      school_id,
    });

    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message,
    });
  }
};

export const getSchoolTree = async (req, res) => {
  try {
    const data = await SectionService.getSchoolTree();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllSectionsClassId = async (req, res) => {
  try {
    // 🔥 priority: params → query
    const class_id = Number(req.params.class_id) || Number(req.query.class_id);

    if (!class_id) {
      return res.status(400).json({ message: "Invalid class_id" });
    }

    const data = await SectionService.getAllSectionsByClassId(class_id);

    res.json(data);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getSectionById = async (req, res) => {
  try {
    const data = await SectionService.getSectionById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const result = await SectionService.deleteSection(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
