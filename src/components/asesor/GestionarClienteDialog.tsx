import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Button, 
  TextField, 
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormGroup
} from '@mui/material';

// Datos del wizard paso 1
interface Step1Data {
  tipoCliente: 'nuevo' | 'antiguo' | '';
  lead: string;
  coordenadas: string;
  score: string;
  nombresApellidos: string;
  tipoDocumento: 'DNI' | 'RUC10' | 'RUC20' | 'CE' | '';
  numeroDocumento: string;
}

// Datos del wizard paso 2
interface Step2Data {
  fechaNacimiento: string;
  lugarNacimiento: string;
  telefonoRegistro: string;
  dniNombreTitular: string;
  parentescoTitular: string;
  telefonoReferencia: string;
  telefonoGrabacion: string;
  correoAfiliado: string;
  departamento: string;
  distrito: string;
  direccion: string;
  piso: string;
}

// Datos del wizard paso 3
interface Step3Data {
  tipoPlan: string;
  servicioContratado: string[];
  velocidadContratada: string;
  precioPlan: string;
  dispositivosAdicionales: string[];
  plataformaDigital: string[];
}

// Datos del wizard paso 4
interface Step4Data {
  pagoAdelantoInstalacion: 'SI' | 'NO' | '';
}

// Importar el tipo Cliente existente
import type { Cliente } from '../../context/AppContext';
import { ubigeoService, type Departamento, type Distrito } from '../../services/UbigeoService';

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onSave: (clienteActualizado: Cliente) => void;
}

const GestionarClienteDialog: React.FC<Props> = ({ open, onClose, cliente, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados para UBIGEO
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [loadingUbigeo, setLoadingUbigeo] = useState(false);

  // Datos del paso 1
  const [step1Data, setStep1Data] = useState<Step1Data>({
    tipoCliente: '',
    lead: '',
    coordenadas: '',
    score: '',
    nombresApellidos: '',
    tipoDocumento: '',
    numeroDocumento: ''
  });

  // Datos del paso 2
  const [step2Data, setStep2Data] = useState<Step2Data>({
    fechaNacimiento: '',
    lugarNacimiento: '',
    telefonoRegistro: '',
    dniNombreTitular: '',
    parentescoTitular: '',
    telefonoReferencia: '',
    telefonoGrabacion: '',
    correoAfiliado: '',
    departamento: '',
    distrito: '',
    direccion: '',
    piso: ''
  });

  // Datos del paso 3
  const [step3Data, setStep3Data] = useState<Step3Data>({
    tipoPlan: '',
    servicioContratado: [],
    velocidadContratada: '',
    precioPlan: '',
    dispositivosAdicionales: [],
    plataformaDigital: []
  });

  // Datos del paso 4
  const [step4Data, setStep4Data] = useState<Step4Data>({
    pagoAdelantoInstalacion: ''
  });

  const steps = [
    'Información del Cliente',
    'Ingreso Persona', 
    'Plan Contratado',
    'Pago Instalación'
  ];

  useEffect(() => {
    if (cliente) {
      // Cargar datos existentes del cliente si los hay
      setStep1Data({
        tipoCliente: 'nuevo', // Por defecto
        lead: cliente.telefono || '',
        coordenadas: '',
        score: '',
        nombresApellidos: cliente.nombre || '',
        tipoDocumento: 'DNI',
        numeroDocumento: cliente.dni || ''
      });
    }
  }, [cliente]);

  // Cargar departamentos al abrir el modal
  useEffect(() => {
    if (open) {
      loadDepartamentos();
    }
  }, [open]);

  const loadDepartamentos = async () => {
    setLoadingUbigeo(true);
    try {
      const deps = await ubigeoService.getDepartamentos();
      setDepartamentos(deps);
    } catch (error) {
      console.error('Error loading departamentos:', error);
    }
    setLoadingUbigeo(false);
  };

  const handleDepartamentoChange = async (departamentoId: string) => {
    console.log('Departamento seleccionado:', departamentoId);
    setStep2Data({ ...step2Data, departamento: departamentoId, distrito: '' });
    setDistritos([]);
    
    if (departamentoId) {
      setLoadingUbigeo(true);
      try {
        console.log('Cargando distritos para departamento:', departamentoId);
        const dists = await ubigeoService.getDistritosByDepartamento(departamentoId);
        console.log('Distritos cargados:', dists.length, dists);
        setDistritos(dists);
      } catch (error) {
        console.error('Error loading distritos:', error);
      }
      setLoadingUbigeo(false);
    }
  };

  // Validación del paso 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step1Data.tipoCliente) {
      newErrors.tipoCliente = 'Invalid option: expected one of "nuevo"|"antiguo"';
    }

    if (!step1Data.lead || step1Data.lead.length < 2) {
      newErrors.lead = 'Ingresar numero de 2 dígitos, sin espacios';
    }

    if (!step1Data.coordenadas) {
      newErrors.coordenadas = 'Invalid input: expected string, received undefined';
    }

    if (!step1Data.score) {
      newErrors.score = 'Invalid input: expected string, received undefined';
    }

    if (!step1Data.nombresApellidos) {
      newErrors.nombresApellidos = 'Invalid input: expected string, received undefined';
    }

    if (!step1Data.tipoDocumento) {
      newErrors.tipoDocumento = 'Invalid option: expected one of "DNI"|"RUC10"|"RUC20"|"CE"';
    }

    if (!step1Data.numeroDocumento) {
      newErrors.numeroDocumento = 'Invalid input: expected string, received undefined';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación del paso 2
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step2Data.fechaNacimiento) {
      newErrors.fechaNacimiento = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.lugarNacimiento) {
      newErrors.lugarNacimiento = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.telefonoRegistro || step2Data.telefonoRegistro.length !== 9) {
      newErrors.telefonoRegistro = 'Ingresar numero de 9 dígitos, sin espacios';
    }

    if (!step2Data.dniNombreTitular) {
      newErrors.dniNombreTitular = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.parentescoTitular) {
      newErrors.parentescoTitular = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.telefonoReferencia || step2Data.telefonoReferencia.length !== 9) {
      newErrors.telefonoReferencia = 'Ingresar numero de 9 dígitos, sin espacios';
    }

    if (!step2Data.telefonoGrabacion || step2Data.telefonoGrabacion.length !== 9) {
      newErrors.telefonoGrabacion = 'Ingresar numero de 9 dígitos, sin espacios';
    }

    if (!step2Data.correoAfiliado) {
      newErrors.correoAfiliado = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.departamento) {
      newErrors.departamento = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.distrito) {
      newErrors.distrito = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.direccion) {
      newErrors.direccion = 'Invalid input: expected string, received undefined';
    }

    if (!step2Data.piso) {
      newErrors.piso = 'Invalid input: expected string, received undefined';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación del paso 3
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step3Data.tipoPlan) {
      newErrors.tipoPlan = 'Invalid input: expected string, received undefined';
    }

    if (step3Data.servicioContratado.length === 0) {
      newErrors.servicioContratado = 'Selecciona al menos un servicio';
    }

    if (!step3Data.velocidadContratada) {
      newErrors.velocidadContratada = 'Invalid input: expected string, received undefined';
    }

    if (!step3Data.precioPlan) {
      newErrors.precioPlan = 'Invalid input: expected string, received undefined';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación del paso 4
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step4Data.pagoAdelantoInstalacion) {
      newErrors.pagoAdelantoInstalacion = 'Selecciona una opción';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!validateStep1()) return;
    } else if (activeStep === 1) {
      if (!validateStep2()) return;
    } else if (activeStep === 2) {
      if (!validateStep3()) return;
    } else if (activeStep === 3) {
      if (!validateStep4()) return;
    }
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSave = async () => {
    // Validar el último paso antes de guardar
    if (!validateStep4()) return;

    // Preparar todos los datos del wizard para enviar al backend
    const wizardData = {
      step1: step1Data,
      step2: step2Data, 
      step3: step3Data,
      step4: step4Data
    };

    console.log('📋 WIZARD: Datos completos del wizard:', wizardData);

    // Mapear todos los datos del wizard a los campos de la base de datos
    const datosParaBackend = {
      // Paso 1: Información básica
      nombre: step1Data.nombresApellidos,
      dni: step1Data.numeroDocumento,
      coordenadas: step1Data.coordenadas,
      tipo_cliente_wizard: step1Data.tipoCliente,
      tipo_documento: step1Data.tipoDocumento,
      lead_score: step1Data.score,
      
      // Paso 2: Información de contacto y ubicación
      telefono: step2Data.telefonoRegistro,
      telefono_registro: step2Data.telefonoRegistro,
      fecha_nacimiento: step2Data.fechaNacimiento,
      lugar_nacimiento: step2Data.lugarNacimiento,
      dni_nombre_titular: step2Data.dniNombreTitular,
      parentesco_titular: step2Data.parentescoTitular,
      telefono_referencia_wizard: step2Data.telefonoReferencia,
      telefono_grabacion_wizard: step2Data.telefonoGrabacion,
      correo_electronico: step2Data.correoAfiliado,
      email: step2Data.correoAfiliado,
      departamento: step2Data.departamento,
      distrito: step2Data.distrito,
      direccion: step2Data.direccion,
      direccion_completa: step2Data.direccion,
      numero_piso_wizard: step2Data.piso,
      
      // Paso 3: Plan y servicios
      tipo_plan: step3Data.tipoPlan,
      servicio_contratado: step3Data.servicioContratado.join(', '),
      velocidad_contratada: step3Data.velocidadContratada,
      precio_plan: step3Data.precioPlan ? parseFloat(step3Data.precioPlan) : null,
      dispositivos_adicionales_wizard: step3Data.dispositivosAdicionales.join(', '),
      plataforma_digital_wizard: step3Data.plataformaDigital.join(', '),
      
      // Paso 4: Pago
      pago_adelanto_instalacion_wizard: step4Data.pagoAdelantoInstalacion,
      
      // Metadatos del wizard
      wizard_completado: true,
      wizard_data_json: JSON.stringify(wizardData),
      observaciones_asesor: `Lead: ${step1Data.lead}. Parentesco titular: ${step2Data.parentescoTitular}. Plan: ${step3Data.tipoPlan} ${step3Data.velocidadContratada}`
    };

    console.log('🚀 WIZARD: Enviando datos al backend:', datosParaBackend);
    
    try {
      // Enviar directamente al backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/clientes/${cliente!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaBackend)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ WIZARD: Error del backend:', error);
        alert(`Error al guardar: ${error.message || 'Error desconocido'}`);
        return;
      }

      const result = await response.json();
      console.log('✅ WIZARD: Cliente actualizado exitosamente:', result);
      
      // Actualizar el estado local con los datos básicos
      const updatedCliente: Cliente = {
        ...cliente!,
        nombre: step1Data.nombresApellidos,
        telefono: step2Data.telefonoRegistro,
        dni: step1Data.numeroDocumento,
        direccion: step2Data.direccion
      };
      
      onSave(updatedCliente);
      onClose();
      
      alert('✅ Wizard completado exitosamente. Los datos han sido guardados.');
    } catch (error) {
      console.error('❌ WIZARD: Error de red:', error);
      alert('Error de red al guardar los datos. Por favor intenta de nuevo.');
    }
  };

  if (!cliente) return null;

  const renderStep4 = () => (
    <Box sx={{ p: 3, minHeight: 400 }}>
      {/* PAGO ADELANTO INSTALACIÓN */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600, color: '#000' }}>
          PAGO ADELANTO INSTALACIÓN *
        </FormLabel>
        <RadioGroup
          value={step4Data.pagoAdelantoInstalacion}
          onChange={(e) => setStep4Data({ ...step4Data, pagoAdelantoInstalacion: e.target.value as 'SI' | 'NO' })}
          sx={{ ml: 1 }}
        >
          <FormControlLabel 
            value="SI" 
            control={<Radio />} 
            label={<Typography variant="body1" sx={{ fontWeight: 500 }}>SI</Typography>}
            sx={{ mb: 1 }}
          />
          <FormControlLabel 
            value="NO" 
            control={<Radio />} 
            label={<Typography variant="body1" sx={{ fontWeight: 500 }}>NO</Typography>}
          />
        </RadioGroup>
        {errors.pagoAdelantoInstalacion && (
          <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
            {errors.pagoAdelantoInstalacion}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ p: 3, minHeight: 400 }}>
      {/* TIPO PLAN */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          TIPO PLAN *
        </FormLabel>
        <FormControl fullWidth size="small">
          <Select
            value={step3Data.tipoPlan}
            onChange={(e) => setStep3Data({ ...step3Data, tipoPlan: e.target.value })}
            displayEmpty
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              Elige
            </MenuItem>
            <MenuItem value="Mono">Mono</MenuItem>
            <MenuItem value="Duo">Duo</MenuItem>
            <MenuItem value="Trio">Trio</MenuItem>
            <MenuItem value="Gamer">Gamer</MenuItem>
          </Select>
        </FormControl>
        {errors.tipoPlan && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.tipoPlan}
          </Typography>
        )}
      </Box>

      {/* SERVICIO CONTRATADO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          SERVICIO CONTRATADO *
        </FormLabel>
        <FormGroup>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[
              'Fibra', 'DGO Full', 'DGO Básico', 'WinTV Básico', 
              'WinTV Plus', 'FonoWin', 'DGO BÁSICO. L1 MAX', 'DGO FULL L1 MAX',
              'WinTV L1 Max', 'WinTV L1 MAX Premium'
            ].map((servicio) => (
              <FormControlLabel
                key={servicio}
                control={
                  <Checkbox
                    checked={step3Data.servicioContratado.includes(servicio)}
                    onChange={(e) => {
                      const newServicios = e.target.checked
                        ? [...step3Data.servicioContratado, servicio]
                        : step3Data.servicioContratado.filter(s => s !== servicio);
                      setStep3Data({ ...step3Data, servicioContratado: newServicios });
                    }}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{servicio}</Typography>}
                sx={{ 
                  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
                  mb: 0.5
                }}
              />
            ))}
          </Box>
        </FormGroup>
        {errors.servicioContratado && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.servicioContratado}
          </Typography>
        )}
      </Box>

      {/* VELOCIDAD CONTRATADA */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          VELOCIDAD CONTRATADA *
        </FormLabel>
        <FormControl fullWidth size="small">
          <Select
            value={step3Data.velocidadContratada}
            onChange={(e) => setStep3Data({ ...step3Data, velocidadContratada: e.target.value })}
            displayEmpty
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              Elige
            </MenuItem>
            <MenuItem value="200 Mbps">200 Mbps</MenuItem>
            <MenuItem value="300 Mbps">300 Mbps</MenuItem>
            <MenuItem value="400 Mbps">400 Mbps</MenuItem>
            <MenuItem value="600 Mbps">600 Mbps</MenuItem>
            <MenuItem value="1000 Mbps">1000 Mbps</MenuItem>
          </Select>
        </FormControl>
        {errors.velocidadContratada && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.velocidadContratada}
          </Typography>
        )}
      </Box>

      {/* PRECIO PLAN */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          PRECIO PLAN *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar precio sin descuento
        </Typography>
        <TextField
          fullWidth
          placeholder="235"
          value={step3Data.precioPlan}
          onChange={(e) => setStep3Data({ ...step3Data, precioPlan: e.target.value })}
          variant="outlined"
          size="small"
          inputMode="numeric"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.precioPlan && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.precioPlan}
          </Typography>
        )}
      </Box>

      {/* DISPOSITIVOS ADICIONALES */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          DISPOSITIVOS ADICIONALES
        </FormLabel>
        <FormGroup>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[
              'NINGUNO', '1 MESH', '1 WINBOX', '2 MESH', '2 WINBOX'
            ].map((dispositivo) => (
              <FormControlLabel
                key={dispositivo}
                control={
                  <Checkbox
                    checked={step3Data.dispositivosAdicionales.includes(dispositivo)}
                    onChange={(e) => {
                      const newDispositivos = e.target.checked
                        ? [...step3Data.dispositivosAdicionales, dispositivo]
                        : step3Data.dispositivosAdicionales.filter(d => d !== dispositivo);
                      setStep3Data({ ...step3Data, dispositivosAdicionales: newDispositivos });
                    }}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{dispositivo}</Typography>}
                sx={{ 
                  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
                  mb: 0.5
                }}
              />
            ))}
          </Box>
        </FormGroup>
      </Box>

      {/* PLATAFORMA DIGITAL */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          PLATAFORMA DIGITAL
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Plataforma para única pantalla.
        </Typography>
        <FormGroup>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[
              'IPTV', 'MAGIS', 'NETFLIX', 'OTRO', 'NINGUNO'
            ].map((plataforma) => (
              <FormControlLabel
                key={plataforma}
                control={
                  <Checkbox
                    checked={step3Data.plataformaDigital.includes(plataforma)}
                    onChange={(e) => {
                      const newPlataformas = e.target.checked
                        ? [...step3Data.plataformaDigital, plataforma]
                        : step3Data.plataformaDigital.filter(p => p !== plataforma);
                      setStep3Data({ ...step3Data, plataformaDigital: newPlataformas });
                    }}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{plataforma}</Typography>}
                sx={{ 
                  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
                  mb: 0.5
                }}
              />
            ))}
          </Box>
        </FormGroup>
      </Box>
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ p: 3, minHeight: 400 }}>
      {/* FECHA NACIMIENTO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          FECHA NACIMIENTO *
        </FormLabel>
        <TextField
          fullWidth
          type="date"
          placeholder="dd/mm/aaaa"
          value={step2Data.fechaNacimiento}
          onChange={(e) => setStep2Data({ ...step2Data, fechaNacimiento: e.target.value })}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.fechaNacimiento && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.fechaNacimiento}
          </Typography>
        )}
      </Box>

      {/* LUGAR DE NACIMIENTO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          LUGAR DE NACIMIENTO *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar departamento de nacimiento
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={step2Data.lugarNacimiento}
            onChange={(e) => setStep2Data({ ...step2Data, lugarNacimiento: e.target.value })}
            displayEmpty
            disabled={loadingUbigeo}
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              {loadingUbigeo ? 'Cargando...' : 'Elige'}
            </MenuItem>
            {departamentos.map((dept) => (
              <MenuItem key={dept.id} value={dept.name}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {errors.lugarNacimiento && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.lugarNacimiento}
          </Typography>
        )}
      </Box>

      {/* TELEFONO REGISTRO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          TELEFONO REGISTRO *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Ingresar numero de 9 dígitos, sin espacios
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step2Data.telefonoRegistro}
          onChange={(e) => {
            // Solo permitir números y máximo 9 dígitos
            const value = e.target.value.replace(/\D/g, '').slice(0, 9);
            setStep2Data({ ...step2Data, telefonoRegistro: value });
          }}
          variant="outlined"
          size="small"
          inputMode="numeric"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.telefonoRegistro && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.telefonoRegistro}
          </Typography>
        )}
      </Box>

      {/* DNI - NOMBRE TITULAR TELF REGISTRO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          DNI - NOMBRE TITULAR TELF REGISTRO *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar DNI - NOMBRE del Titular de la línea afiliada
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step2Data.dniNombreTitular}
          onChange={(e) => setStep2Data({ ...step2Data, dniNombreTitular: e.target.value })}
          variant="outlined"
          size="small"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.dniNombreTitular && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.dniNombreTitular}
          </Typography>
        )}
      </Box>

      {/* PARENTESCO TITULAR LÍNEA TELEFÓNICA */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          PARENTESCO TITULAR LÍNEA TELEFÓNICA *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar relación de titular de telf registro con titular línea internet
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={step2Data.parentescoTitular}
            onChange={(e) => setStep2Data({ ...step2Data, parentescoTitular: e.target.value })}
            displayEmpty
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              Elige
            </MenuItem>
            <MenuItem value="Titular">Titular</MenuItem>
            <MenuItem value="Cónyuge">Cónyuge</MenuItem>
            <MenuItem value="Hijo/a">Hijo/a</MenuItem>
            <MenuItem value="Padre/Madre">Padre/Madre</MenuItem>
            <MenuItem value="Hermano/a">Hermano/a</MenuItem>
            <MenuItem value="Tio">Tio</MenuItem>
            <MenuItem value="Primo">Primo</MenuItem>
            <MenuItem value="Amigo">Amigo</MenuItem>
            <MenuItem value="Vecino">Vecino</MenuItem>
            <MenuItem value="Pariente">Pariente</MenuItem>
          </Select>
        </FormControl>
        {errors.parentescoTitular && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.parentescoTitular}
          </Typography>
        )}
      </Box>

      {/* TELEFONO REFERENCIA */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          TELEFONO REFERENCIA *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Ingresar numero de 9 dígitos, sin espacios
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step2Data.telefonoReferencia}
          onChange={(e) => {
            // Solo permitir números y máximo 9 dígitos
            const value = e.target.value.replace(/\D/g, '').slice(0, 9);
            setStep2Data({ ...step2Data, telefonoReferencia: value });
          }}
          variant="outlined"
          size="small"
          inputMode="numeric"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.telefonoReferencia && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.telefonoReferencia}
          </Typography>
        )}
      </Box>

      {/* TELEFONO GRABACION */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          TELEFONO GRABACION *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Ingresar numero de 9 dígitos, sin espacios
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step2Data.telefonoGrabacion}
          onChange={(e) => {
            // Solo permitir números y máximo 9 dígitos
            const value = e.target.value.replace(/\D/g, '').slice(0, 9);
            setStep2Data({ ...step2Data, telefonoGrabacion: value });
          }}
          variant="outlined"
          size="small"
          inputMode="numeric"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.telefonoGrabacion && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.telefonoGrabacion}
          </Typography>
        )}
      </Box>

      {/* CORREO AFILIADO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          CORREO AFILIADO *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          especificar correo válido
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step2Data.correoAfiliado}
          onChange={(e) => setStep2Data({ ...step2Data, correoAfiliado: e.target.value })}
          variant="outlined"
          size="small"
          type="email"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.correoAfiliado && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.correoAfiliado}
          </Typography>
        )}
      </Box>

      {/* DEPARTAMENTO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          DEPARTAMENTO *
        </FormLabel>
        <FormControl fullWidth size="small">
          <Select
            value={step2Data.departamento}
            onChange={(e) => handleDepartamentoChange(e.target.value)}
            displayEmpty
            disabled={loadingUbigeo}
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              {loadingUbigeo ? 'Cargando...' : 'Elige'}
            </MenuItem>
            {departamentos.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {errors.departamento && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.departamento}
          </Typography>
        )}
      </Box>

      {/* DISTRITO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          DISTRITO *
        </FormLabel>
        <FormControl fullWidth size="small">
          <Select
            value={step2Data.distrito}
            onChange={(e) => setStep2Data({ ...step2Data, distrito: e.target.value })}
            displayEmpty
            disabled={loadingUbigeo || distritos.length === 0}
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              {loadingUbigeo ? 'Cargando...' : distritos.length === 0 ? 'Selecciona departamento primero' : 'Elige'}
            </MenuItem>
            {distritos.map((dist) => (
              <MenuItem key={dist.id} value={dist.id}>
                {dist.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {errors.distrito && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.distrito}
          </Typography>
        )}
      </Box>

      {/* DIRECCION */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          DIRECCION *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar dirección de vivienda (incluir Calle, Pasaje, Jirón, etc)
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step2Data.direccion}
          onChange={(e) => setStep2Data({ ...step2Data, direccion: e.target.value })}
          variant="outlined"
          size="small"
          multiline
          rows={2}
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.direccion && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.direccion}
          </Typography>
        )}
      </Box>

      {/* PISO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          PISO *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Precisar piso de instalación
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={step2Data.piso}
            onChange={(e) => setStep2Data({ ...step2Data, piso: e.target.value })}
            displayEmpty
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              Elige
            </MenuItem>
            <MenuItem value="1">1er Piso</MenuItem>
            <MenuItem value="2">2do Piso</MenuItem>
            <MenuItem value="3">3er Piso</MenuItem>
            <MenuItem value="4">4to Piso</MenuItem>
            <MenuItem value="5">5to Piso</MenuItem>
            <MenuItem value="6">6to Piso</MenuItem>
            <MenuItem value="7">7mo Piso</MenuItem>
            <MenuItem value="8">8vo Piso</MenuItem>
            <MenuItem value="9">9no Piso</MenuItem>
            <MenuItem value="10+">10+ Piso</MenuItem>
            <MenuItem value="Casa">Casa (1 nivel)</MenuItem>
            <MenuItem value="Azotea">Azotea</MenuItem>
          </Select>
        </FormControl>
        {errors.piso && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.piso}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderStep1 = () => (
    <Box sx={{ p: 3, minHeight: 400 }}>
      {/* TIPO CLIENTE */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          TIPO CLIENTE *
        </FormLabel>
        <RadioGroup
          row
          value={step1Data.tipoCliente}
          onChange={(e) => setStep1Data({ ...step1Data, tipoCliente: e.target.value as 'nuevo' | 'antiguo' })}
        >
          <FormControlLabel 
            value="nuevo" 
            control={<Radio />} 
            label="Nuevo" 
            sx={{ mr: 4 }}
          />
          <FormControlLabel 
            value="antiguo" 
            control={<Radio />} 
            label="Antiguo" 
          />
        </RadioGroup>
        {errors.tipoCliente && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.tipoCliente}
          </Typography>
        )}
      </Box>

      {/* LEAD */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          LEAD *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Ingresar numero de 2 dígitos, sin espacios
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step1Data.lead}
          onChange={(e) => setStep1Data({ ...step1Data, lead: e.target.value })}
          variant="outlined"
          size="small"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.lead && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.lead}
          </Typography>
        )}
      </Box>

      {/* COORDENADAS */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          COORDENADAS *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar coordenadas de la dirección exacta
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step1Data.coordenadas}
          onChange={(e) => setStep1Data({ ...step1Data, coordenadas: e.target.value })}
          variant="outlined"
          size="small"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.coordenadas && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.coordenadas}
          </Typography>
        )}
      </Box>

      {/* SCORE */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          SCORE *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar el rango del cliente
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={step1Data.score}
            onChange={(e) => setStep1Data({ ...step1Data, score: e.target.value })}
            displayEmpty
            sx={{ 
              backgroundColor: '#f5f5f5',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
            }}
          >
            <MenuItem disabled value="">
              Elige
            </MenuItem>
            <MenuItem value="A">A - Excelente</MenuItem>
            <MenuItem value="B">B - Bueno</MenuItem>
            <MenuItem value="C">C - Regular</MenuItem>
            <MenuItem value="D">D - Bajo</MenuItem>
          </Select>
        </FormControl>
        {errors.score && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.score}
          </Typography>
        )}
      </Box>

      {/* NOMBRES Y APELLIDOS */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          NOMBRES Y APELLIDOS *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Especificar NOMBRES y APELLIDOS en ese orden, sin dejar espacios
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step1Data.nombresApellidos}
          onChange={(e) => setStep1Data({ ...step1Data, nombresApellidos: e.target.value })}
          variant="outlined"
          size="small"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.nombresApellidos && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.nombresApellidos}
          </Typography>
        )}
      </Box>

      {/* TIPO DOCUMENTO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          TIPO DOCUMENTO *
        </FormLabel>
        <RadioGroup
          value={step1Data.tipoDocumento}
          onChange={(e) => setStep1Data({ ...step1Data, tipoDocumento: e.target.value as 'DNI' | 'RUC10' | 'RUC20' | 'CE' })}
        >
          <FormControlLabel 
            value="DNI" 
            control={<Radio />} 
            label="DNI" 
          />
          <FormControlLabel 
            value="RUC10" 
            control={<Radio />} 
            label="RUC10" 
          />
          <FormControlLabel 
            value="RUC20" 
            control={<Radio />} 
            label="RUC20" 
          />
          <FormControlLabel 
            value="CE" 
            control={<Radio />} 
            label="CE" 
          />
        </RadioGroup>
        {errors.tipoDocumento && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.tipoDocumento}
          </Typography>
        )}
      </Box>

      {/* N° DOCUMENTO */}
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, color: '#000' }}>
          N° DOCUMENTO *
        </FormLabel>
        <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Asegurarse de no dejar espacios ni antes ni después del número de documento
        </Typography>
        <TextField
          fullWidth
          placeholder="Tu respuesta"
          value={step1Data.numeroDocumento}
          onChange={(e) => setStep1Data({ ...step1Data, numeroDocumento: e.target.value })}
          variant="outlined"
          size="small"
          sx={{ 
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        {errors.numeroDocumento && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
            {errors.numeroDocumento}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 2 }}>
        {/* Header del wizard */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Formulario de Registro de Cliente - Wizard
          </Typography>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
            ×
          </Button>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '0.75rem',
                    fontWeight: activeStep === index ? 600 : 400
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Contenido del paso */}
        <DialogContent sx={{ p: 0 }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}
        </DialogContent>

        {/* Botones de navegación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Paso {activeStep + 1} de {steps.length}
          </Typography>

          <Box>
            {activeStep > 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Anterior
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                variant="contained"
                sx={{ 
                  backgroundColor: '#000',
                  '&:hover': { backgroundColor: '#333' }
                }}
                endIcon="→"
              >
                Siguiente
              </Button>
            ) : (
              <Button 
                onClick={handleSave}
                variant="contained"
                sx={{ 
                  backgroundColor: '#000',
                  '&:hover': { backgroundColor: '#333' }
                }}
              >
                Guardar Gestión
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default GestionarClienteDialog;