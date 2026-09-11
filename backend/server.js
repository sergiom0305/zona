import express from 'express';
import cors from 'cors';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Función para convertir número serial de Excel a fecha
const excelDateToJSDate = (excelDate) => {
  // Si es un número, convertir desde número serial de Excel
  if (typeof excelDate === 'number') {
    // Excel comienza a contar desde 1 enero 1900 como día 1
    // Fórmula correcta: fecha = baseDate + (excelDate - 1) días
    const baseDate = new Date(1900, 0, 1); // 1 de enero de 1900
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(baseDate.getTime() + (excelDate - 1) * millisecondsPerDay);
    return date;
  }
  
  // Si es texto, intentar parsear como fecha
  if (typeof excelDate === 'string') {
    return new Date(excelDate);
  }
  
  return new Date();
};

// Función para calcular antigüedad en meses
const calcularAntiguedadMeses = (fechaIngreso) => {
  const fecha = excelDateToJSDate(fechaIngreso);
  const hoy = new Date();
  
  console.log('Fecha de ingreso recibida:', fechaIngreso);
  console.log('Fecha de ingreso convertida:', fecha.toISOString().split('T')[0]);
  console.log('Hoy:', hoy.toISOString().split('T')[0]);
  
  let meses = (hoy.getFullYear() - fecha.getFullYear()) * 12;
  meses += hoy.getMonth() - fecha.getMonth();
  
  console.log('Meses calculados:', meses);
  
  return meses;
};

// Función para leer el Excel
const leerEmpleados = () => {
  try {
    const rutaExcel = path.join(__dirname, 'data', 'empleados.xlsx');
    
    if (!fs.existsSync(rutaExcel)) {
      console.error('Archivo Excel no encontrado en:', rutaExcel);
      return [];
    }
    
    // Opción cellDates: true para que XLSX convierta automáticamente fechas de Excel
    const workbook = XLSX.readFile(rutaExcel, { cellDates: true });
    const nombreHoja = workbook.SheetNames[0];
    const hoja = workbook.Sheets[nombreHoja];
    const datos = XLSX.utils.sheet_to_json(hoja);
    
    return datos;
  } catch (error) {
    console.error('Error al leer el Excel:', error);
    return [];
  }
};

// Endpoint para validar cédula
app.post('/api/validar-cedula', (req, res) => {
  try {
    const { cedula } = req.body;
    
    if (!cedula || cedula.trim() === '') {
      return res.status(400).json({
        valido: false,
        mensaje: 'La cédula es requerida'
      });
    }
    
    const empleados = leerEmpleados();
    
    console.log('Cédula buscada:', cedula.trim());
    console.log('Empleados encontrados:', empleados.length);
    if (empleados.length > 0) {
      console.log('Columnas del Excel:', Object.keys(empleados[0]));
      console.log('Primer registro:', empleados[0]);
    }
    
    // Buscar el empleado por cédula - Normalizar nombres de columnas
    const empleado = empleados.find(emp => {
      // Obtener la cédula del empleado, probando diferentes formatos de columna
      const cedulaEmpleado = String(
        emp.Cédula || 
        emp.cedula || 
        emp.CEDULA ||
        emp['Cédula'] ||
        emp['cedula'] ||
        emp['CEDULA']
      ).trim();
      
      console.log('Comparando:', cedula.trim(), 'con', cedulaEmpleado);
      return cedulaEmpleado === cedula.trim();
    });
    
    if (!empleado) {
      console.log('Empleado no encontrado');
      return res.status(404).json({
        valido: false,
        mensaje: 'Cédula no encontrada en nuestros registros'
      });
    }
    
    console.log('Empleado encontrado:', empleado);
    
    // Validar que no tenga préstamo activo
    const prestamoActivo = String(
      empleado['Préstamo Activo'] || 
      empleado['prestamo activo'] || 
      empleado['PRESTAMO ACTIVO'] ||
      empleado['Prestamo Activo'] ||
      empleado['prestamo_activo']
    ).toUpperCase().trim();
    
    if (prestamoActivo === 'SI') {
      return res.status(400).json({
        valido: false,
        mensaje: 'No puedes solicitar un préstamo, tienes un préstamo activo',
        empleado: {
          cedula: empleado.Cédula || empleado.cedula,
          nombre: empleado.Nombre || empleado.nombre,
          prestamoActivo: prestamoActivo
        }
      });
    }
    
    // Validar antigüedad (6 meses o más)
    const fechaIngreso = String(
      empleado['Fecha Ingreso'] || 
      empleado['fecha ingreso'] || 
      empleado['FECHA INGRESO'] ||
      empleado['Fecha ingreso'] ||
      empleado['fecha_ingreso']
    ).trim();
    
    const antiguedadMeses = calcularAntiguedadMeses(fechaIngreso);
    
    if (antiguedadMeses < 6) {
      return res.status(400).json({
        valido: false,
        mensaje: `Debes tener una antigüedad mínima de 6 meses. Tienes ${antiguedadMeses} meses`,
        empleado: {
          cedula: empleado.Cédula || empleado.cedula,
          nombre: empleado.Nombre || empleado.nombre,
          fechaIngreso: fechaIngreso,
          antiguedadMeses: antiguedadMeses
        }
      });
    }
    
    // Validar que esté activo
    const activo = String(
      empleado.Activo || 
      empleado.activo || 
      empleado.ACTIVO
    ).toUpperCase().trim();
    
    if (activo !== 'SI') {
      return res.status(400).json({
        valido: false,
        mensaje: 'No estás activo en nuestros registros',
        empleado: {
          cedula: empleado.Cédula || empleado.cedula,
          nombre: empleado.Nombre || empleado.nombre,
          activo: activo
        }
      });
    }
    
    // Todas las validaciones pasaron
    return res.status(200).json({
      valido: true,
      mensaje: 'Validación exitosa. Procede a solicitar préstamo',
      empleado: {
        cedula: empleado.Cédula || empleado.cedula,
        nombre: empleado.Nombre || empleado.nombre,
        fechaIngreso: fechaIngreso,
        antiguedadMeses: antiguedadMeses,
        activo: activo,
        prestamoActivo: prestamoActivo
      }
    });
    
  } catch (error) {
    console.error('Error en la validación:', error);
    return res.status(500).json({
      valido: false,
      mensaje: 'Error en el servidor'
    });
  }
});

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'El servidor está funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log('Endpoint: POST http://localhost:3001/api/validar-cedula');
});
