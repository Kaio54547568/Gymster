-- Safe migration to update existing trainer employees
-- Synchronize employees.department with trainers.specialty for trainer roles.
-- Do not overwrite normal staff departments.

UPDATE employees e
SET department = t.specialty
FROM trainers t
WHERE e.id = t.employee_id;
