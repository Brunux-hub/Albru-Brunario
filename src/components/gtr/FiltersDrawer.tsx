import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  TextField,
  Button,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CampaignIcon from '@mui/icons-material/Campaign';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';

// Categorías disponibles
const CATEGORIAS = [
  'Seleccionar categoría',
  'Lista negra',
  'Preventa completa',
  'Preventa',
  'Sin facilidades',
  'Retirado',
  'Rechazado',
  'Agendado',
  'Seguimiento',
  'Sin contacto'
];

interface FiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  availableCampanas: string[];
  availableSalas: string[];
  availableCompanias: string[];
}

export interface FilterState {
  categorias: string[];
  dateRangeType: 'today' | 'thisWeek' | 'thisMonth' | 'last30Days' | 'custom';
  startDate: string;
  endDate: string;
  campanas: string[];
  salas: string[];
  companias: string[];
}

export const FiltersDrawer: React.FC<FiltersDrawerProps> = ({
  open,
  onClose,
  onApplyFilters,
  availableCampanas,
  availableSalas,
  availableCompanias
}) => {
  // Inicializar con las fechas del mes actual
  const getInitialDates = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const initialDates = getInitialDates();

  const [filters, setFilters] = useState<FilterState>({
    categorias: [],
    dateRangeType: 'thisMonth',
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    campanas: [],
    salas: [],
    companias: []
  });

  const handleCategoriaChange = (categoria: string) => {
    setFilters(prev => ({
      ...prev,
      categorias: prev.categorias.includes(categoria)
        ? prev.categorias.filter(c => c !== categoria)
        : [...prev.categorias, categoria]
    }));
  };

  const handleCampanaChange = (campana: string) => {
    setFilters(prev => ({
      ...prev,
      campanas: prev.campanas.includes(campana)
        ? prev.campanas.filter(c => c !== campana)
        : [...prev.campanas, campana]
    }));
  };

  const handleSalaChange = (sala: string) => {
    setFilters(prev => ({
      ...prev,
      salas: prev.salas.includes(sala)
        ? prev.salas.filter(s => s !== sala)
        : [...prev.salas, sala]
    }));
  };

  const handleCompaniaChange = (compania: string) => {
    setFilters(prev => ({
      ...prev,
      companias: prev.companias.includes(compania)
        ? prev.companias.filter(c => c !== compania)
        : [...prev.companias, compania]
    }));
  };

  const handleDateRangeTypeChange = (type: FilterState['dateRangeType']) => {
    const today = new Date();
    let startDate = '';
    let endDate = '';

    switch (type) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'thisWeek': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      }
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last30Days': {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      }
      case 'custom':
        // Keep existing dates
        return setFilters(prev => ({ ...prev, dateRangeType: type }));
    }

    setFilters(prev => ({ ...prev, dateRangeType: type, startDate, endDate }));
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      categorias: [],
      dateRangeType: 'thisMonth',
      startDate: '',
      endDate: '',
      campanas: [],
      salas: [],
      companias: []
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    return filters.categorias.length + 
           filters.campanas.length + 
           filters.salas.length + 
           filters.companias.length +
           (filters.dateRangeType !== 'thisMonth' ? 1 : 0);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          bgcolor: '#f9fafb'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: 'white',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon sx={{ color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filtros Avanzados
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Filters Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Categorías */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon sx={{ color: '#1976d2' }} />
                <Typography sx={{ fontWeight: 600 }}>
                  Categorías Comerciales
                </Typography>
                {filters.categorias.length > 0 && (
                  <Chip 
                    label={filters.categorias.length} 
                    size="small" 
                    color="primary"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {CATEGORIAS.map(categoria => (
                  <FormControlLabel
                    key={categoria}
                    control={
                      <Checkbox
                        checked={filters.categorias.includes(categoria)}
                        onChange={() => handleCategoriaChange(categoria)}
                        size="small"
                      />
                    }
                    label={categoria}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Período de Tiempo */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ color: '#1976d2' }} />
                <Typography sx={{ fontWeight: 600 }}>
                  Período de Tiempo
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RadioGroup
                  value={filters.dateRangeType}
                  onChange={(e) => handleDateRangeTypeChange(e.target.value as FilterState['dateRangeType'])}
                >
                  <FormControlLabel 
                    value="today" 
                    control={<Radio size="small" />} 
                    label="Hoy" 
                  />
                  <FormControlLabel 
                    value="thisWeek" 
                    control={<Radio size="small" />} 
                    label="Esta semana" 
                  />
                  <FormControlLabel 
                    value="thisMonth" 
                    control={<Radio size="small" />} 
                    label="Este mes" 
                  />
                  <FormControlLabel 
                    value="last30Days" 
                    control={<Radio size="small" />} 
                    label="Últimos 30 días" 
                  />
                  <FormControlLabel 
                    value="custom" 
                    control={<Radio size="small" />} 
                    label="Personalizado" 
                  />
                </RadioGroup>

                {filters.dateRangeType === 'custom' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                      label="Desde"
                      type="date"
                      size="small"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="Hasta"
                      type="date"
                      size="small"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Campañas */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CampaignIcon sx={{ color: '#1976d2' }} />
                <Typography sx={{ fontWeight: 600 }}>
                  Campañas
                </Typography>
                {filters.campanas.length > 0 && (
                  <Chip 
                    label={filters.campanas.length} 
                    size="small" 
                    color="primary"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 250, overflow: 'auto' }}>
                {availableCampanas.length > 0 ? (
                  availableCampanas.map(campana => (
                    <FormControlLabel
                      key={campana}
                      control={
                        <Checkbox
                          checked={filters.campanas.includes(campana)}
                          onChange={() => handleCampanaChange(campana)}
                          size="small"
                        />
                      }
                      label={campana}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay campañas disponibles
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Salas */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MeetingRoomIcon sx={{ color: '#1976d2' }} />
                <Typography sx={{ fontWeight: 600 }}>
                  Salas
                </Typography>
                {filters.salas.length > 0 && (
                  <Chip 
                    label={filters.salas.length} 
                    size="small" 
                    color="primary"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {availableSalas.length > 0 ? (
                  availableSalas.map(sala => (
                    <FormControlLabel
                      key={sala}
                      control={
                        <Checkbox
                          checked={filters.salas.includes(sala)}
                          onChange={() => handleSalaChange(sala)}
                          size="small"
                        />
                      }
                      label={sala}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay salas disponibles
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Compañías */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ color: '#1976d2' }} />
                <Typography sx={{ fontWeight: 600 }}>
                  Compañías
                </Typography>
                {filters.companias.length > 0 && (
                  <Chip 
                    label={filters.companias.length} 
                    size="small" 
                    color="primary"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {availableCompanias.length > 0 ? (
                  availableCompanias.map(compania => (
                    <FormControlLabel
                      key={compania}
                      control={
                        <Checkbox
                          checked={filters.companias.includes(compania)}
                          onChange={() => handleCompaniaChange(compania)}
                          size="small"
                        />
                      }
                      label={compania}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay compañías disponibles
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'white', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Filtros activos: <strong>{getActiveFiltersCount()}</strong>
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={handleClearFilters}
              sx={{ color: '#ef4444' }}
            >
              Limpiar todo
            </Button>
          </Box>
          <Button
            variant="contained"
            fullWidth
            onClick={handleApplyFilters}
            startIcon={<FilterListIcon />}
            sx={{ 
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            Aplicar Filtros
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default FiltersDrawer;
