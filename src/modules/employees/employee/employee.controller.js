import * as EmployeeService from "./employee.service.js";

export const createEmployee = async (req, res) => {
  try {
    // console.log("createEmployee req.body:", req.body);
    // console.log("createEmployee req.files:", req.files);
    const result = await EmployeeService.createEmployee(req);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    // console.log("updateEmployee req.body:", req.body);
    // console.log("updateEmployee req.files:", req.files);
    const result = await EmployeeService.updateEmployee(req.params.id, req);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.deleteEmployee(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const result = await EmployeeService.getEmployee(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const sendEmployeeListResponse = (res, result, query) => {
  // Always attach pagination metadata headers
  res.set("X-Total-Count", String(result.pagination.total));
  res.set("X-Page", String(result.pagination.page));
  res.set("X-Limit", String(result.pagination.limit));
  res.set("X-Total-Pages", String(result.pagination.totalPages));
  res.set("X-From", String(result.pagination.from));
  res.set("X-To", String(result.pagination.to));
  res.set("X-Count", String(result.pagination.count));

  const shouldPaginate =
    query.paginate === "true" ||
    query.format === "paginated" ||
    query.meta === "true";

  if (shouldPaginate) {
    return res.json({
      success: true,
      data: result.rows,
      pagination: result.pagination,
      filter_display: result.filter_display,
      filters: result.filters,
    });
  }

  // Default raw array response for backwards compatibility
  return res.json(result.rows);
};

export const getAllEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.getEmployees(req.query);
    return sendEmployeeListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllEmployeeByToken = async (req, res) => {
  try {
    const result = await EmployeeService.getEmployeesByToken(req.user, req.query);
    return sendEmployeeListResponse(res, result, req.query);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getEmployeeFilterOptions = async (req, res) => {
  try {
    const options = await EmployeeService.getEmployeeFilterOptions(
      req.user,
      req.query.school_id,
    );
    res.json({ success: true, options });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const stats = await EmployeeService.getEmployeeStats(
      req.user,
      req.query.school_id,
    );
    res.json({ success: true, stats });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const assignUserToEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.assignUserToEmployee(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const unassignUserFromEmployee = async (req, res) => {
  try {
    const result = await EmployeeService.unassignUserFromEmployee(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
