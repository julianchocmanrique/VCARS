import AsyncStorage from '@react-native-async-storage/async-storage'
import { CLIENT_IDENTITY_KEY } from './vcarsClientIdentity'
import { getStepTitle } from './vcarsProcess'

const PROFILE_KEY = '@vcars_profile'
const ENTRIES_KEY = '@vcars_entries'
const CURRENT_ENTRY_KEY = '@vcars_current_entry'
const STORAGE_MAP_KEY = '@vcars_orden_servicio_map'

const CLIENT_COMPANY = {
  type: 'empresa',
  name: 'Constructora Delta SAS',
  companyName: 'Constructora Delta SAS',
  plates: ['GHI789', 'MNO654', 'STU159'],
}

function nowIso() {
  return new Date().toISOString()
}

function withMeta(entry) {
  return {
    ...entry,
    paso: entry.paso || getStepTitle(entry.stepIndex || 0),
    createdAt: entry.createdAt || nowIso(),
    updatedAt: entry.updatedAt || nowIso(),
    history: Array.isArray(entry.history) ? entry.history : [],
  }
}

const DATASET = [
  {
    id: 'os-2001',
    placa: 'ABC123',
    cliente: 'Juan Perez',
    telefono: '3001234567',
    vehiculo: 'Mazda 3 2018',
    empresa: 'Particular',
    stepIndex: 0,
    paso: 'Recepción (Ingreso)',
    status: 'active',
    updatedAt: '2026-03-11T10:00:00.000Z',
    history: [
      {
        date: '2026-03-11T10:00:00.000Z',
        actorRole: 'administrativo',
        fromStep: null,
        toStep: 'Recepción (Ingreso)',
      },
    ],
    form: {
      ordenNo: '2001',
      fechaEntrada: '2026-03-11',
      fechaEntrega: '2026-03-13',
      propietario: 'Juan Perez',
      nit: '1022334455',
      telefono: '3001234567',
      email: 'juan.perez@gmail.com',
      facturaNombre: 'Juan Perez',
      formaPago: 'Transferencia',
      formaPagoOtro: '',
      bancoTransferencia: 'Nequi',
      pagoDias: '',
      placa: 'ABC123',
      marca: 'Mazda 3',
      modelo: '2018',
      color: 'Rojo',
      empresa: 'Particular',
      direccion: 'Cra 10 # 20-30',
      soatFV: '2026-09-10',
      rtmFV: '2026-08-01',
      kilometraje: '84500',
      combustible: '50%',
      fallaCliente: 'Ruido al frenar y vibracion en pedal.',
      observaciones: 'Entrega con tapetes y radio original.',
      inventario: {
        Radio: 'S',
        Encendedor: 'S',
        Tapetes: 'S',
        Parasoles: 'C',
        Kit: 'S',
      },
      inventarioNotas: 'Plumillas desgastadas.',
      condicionFisica: 'Golpe leve en bumper trasero, rayones superficiales.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2001',
      cotizacionCondiciones: '50% anticipo y saldo contra entrega.',
      cotizacionItems: [
        {
          sistema: 'Frenos',
          trabajo: 'Cambio pastillas delanteras',
          precio: '180000',
          cantidad: '1',
          total: '180000',
        },
      ],
      cotizacionSubtotal: '180000',
      cotizacionIva: '34200',
      cotizacionTotal: '214200',
      cotizacionFecha: '2026-03-11',
      cotizacionObservaciones: 'Revisar discos en proximo mantenimiento.',
      tecnico: 'Carlos Mejia',
      conservarPiezas: 'Si',
      firmaAutoriza: '',
      fechaAutoriza: '',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: '',
      medioAprobacion: '',
      trabajoRealizado: '',
      piezasCambiadas: '',
      observacionesEntrega: '',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2002',
    placa: 'DEF456',
    cliente: 'Maria Gomez',
    telefono: '3115556677',
    vehiculo: 'Kia Rio 2016',
    empresa: 'Particular',
    stepIndex: 1,
    paso: 'Diagnóstico / Cotización interna',
    status: 'active',
    updatedAt: '2026-03-11T10:10:00.000Z',
    history: [
      {
        date: '2026-03-11T09:40:00.000Z',
        actorRole: 'administrativo',
        fromStep: null,
        toStep: 'Recepción (Ingreso)',
      },
      {
        date: '2026-03-11T10:10:00.000Z',
        actorRole: 'tecnico',
        fromStep: 'Recepción (Ingreso)',
        toStep: 'Diagnóstico / Cotización interna',
      },
    ],
    form: {
      ordenNo: '2002',
      fechaEntrada: '2026-03-11',
      fechaEntrega: '2026-03-14',
      propietario: 'Maria Gomez',
      nit: '52100987',
      telefono: '3115556677',
      email: 'maria.gomez@gmail.com',
      facturaNombre: 'Maria Gomez',
      formaPago: 'Tarjeta',
      formaPagoOtro: '',
      bancoTransferencia: '',
      pagoDias: '',
      placa: 'DEF456',
      marca: 'Kia Rio',
      modelo: '2016',
      color: 'Blanco',
      empresa: 'Particular',
      direccion: 'Calle 55 # 18-22',
      soatFV: '2026-07-15',
      rtmFV: '2026-06-20',
      kilometraje: '112300',
      combustible: '25%',
      fallaCliente: 'No enciende en frio.',
      observaciones: 'Bateria reemplazada hace 2 años.',
      inventario: {},
      inventarioNotas: 'Sin novedades de inventario.',
      condicionFisica: 'Buen estado general, pequeños rayones laterales.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2002',
      cotizacionCondiciones: 'Pago total contra entrega.',
      cotizacionItems: [
        {
          sistema: 'Electrico',
          trabajo: 'Diagnostico sistema de arranque',
          precio: '90000',
          cantidad: '1',
          total: '90000',
        },
      ],
      cotizacionSubtotal: '90000',
      cotizacionIva: '17100',
      cotizacionTotal: '107100',
      cotizacionFecha: '2026-03-11',
      cotizacionObservaciones: 'Posible cambio de bateria o motor de arranque.',
      tecnico: 'Andres Ruiz',
      conservarPiezas: 'No',
      firmaAutoriza: '',
      fechaAutoriza: '',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: '',
      medioAprobacion: '',
      trabajoRealizado: 'Revision inicial de bateria y relay.',
      piezasCambiadas: '',
      observacionesEntrega: '',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2003',
    placa: 'GHI789',
    cliente: 'Constructora Delta SAS',
    telefono: '6014448899',
    vehiculo: 'Chevrolet NHR 2020',
    empresa: 'Constructora Delta SAS',
    stepIndex: 2,
    paso: 'Cotización al cliente (Admin)',
    status: 'active',
    updatedAt: '2026-03-11T10:20:00.000Z',
    history: [],
    form: {
      ordenNo: '2003',
      fechaEntrada: '2026-03-10',
      fechaEntrega: '2026-03-15',
      propietario: 'Constructora Delta SAS',
      nit: '901334455',
      telefono: '6014448899',
      email: 'mantenimiento@delta.com',
      facturaNombre: 'Constructora Delta SAS',
      formaPago: 'Credito',
      formaPagoOtro: '',
      bancoTransferencia: '',
      pagoDias: '30',
      placa: 'GHI789',
      marca: 'Chevrolet NHR',
      modelo: '2020',
      color: 'Blanco',
      empresa: 'Constructora Delta SAS',
      direccion: 'Zona Industrial Bodega 12',
      soatFV: '2026-10-01',
      rtmFV: '2026-11-05',
      kilometraje: '156000',
      combustible: '75%',
      fallaCliente: 'Perdida de potencia y humo negro.',
      observaciones: 'Vehiculo de operacion diaria.',
      inventario: {},
      inventarioNotas: 'Sin accesorios adicionales.',
      condicionFisica: 'Cabina con desgaste normal de trabajo.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2003',
      cotizacionCondiciones: 'Credito 30 dias.',
      cotizacionItems: [
        {
          sistema: 'Motor',
          trabajo: 'Limpieza inyectores y cambio filtros',
          precio: '420000',
          cantidad: '1',
          total: '420000',
        },
      ],
      cotizacionSubtotal: '420000',
      cotizacionIva: '79800',
      cotizacionTotal: '499800',
      cotizacionFecha: '2026-03-11',
      cotizacionObservaciones: 'Revisar turbo si persiste humo.',
      tecnico: 'Luis Herrera',
      conservarPiezas: 'No',
      firmaAutoriza: '',
      fechaAutoriza: '',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: '',
      medioAprobacion: '',
      trabajoRealizado: 'Diagnostico de inyeccion realizado.',
      piezasCambiadas: '',
      observacionesEntrega: '',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2004',
    placa: 'JKL321',
    cliente: 'Laura Martinez',
    telefono: '3209981122',
    vehiculo: 'Renault Duster 2019',
    empresa: 'Particular',
    stepIndex: 3,
    paso: 'Autorización del cliente',
    status: 'active',
    updatedAt: '2026-03-11T10:30:00.000Z',
    history: [],
    form: {
      ordenNo: '2004',
      fechaEntrada: '2026-03-10',
      fechaEntrega: '2026-03-12',
      propietario: 'Laura Martinez',
      nit: '43111222',
      telefono: '3209981122',
      email: 'laura.mt@gmail.com',
      facturaNombre: 'Laura Martinez',
      formaPago: 'Efectivo',
      formaPagoOtro: '',
      bancoTransferencia: '',
      pagoDias: '',
      placa: 'JKL321',
      marca: 'Renault Duster',
      modelo: '2019',
      color: 'Gris',
      empresa: 'Particular',
      direccion: 'Av 68 # 40-15',
      soatFV: '2026-12-10',
      rtmFV: '2026-09-20',
      kilometraje: '65400',
      combustible: '50%',
      fallaCliente: 'Check engine encendido.',
      observaciones: 'Solicita entrega rapida.',
      inventario: {},
      inventarioNotas: '',
      condicionFisica: 'Estado exterior muy bueno.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2004',
      cotizacionCondiciones: 'Pago contra entrega.',
      cotizacionItems: [
        {
          sistema: 'Sensor',
          trabajo: 'Cambio sensor oxigeno',
          precio: '260000',
          cantidad: '1',
          total: '260000',
        },
      ],
      cotizacionSubtotal: '260000',
      cotizacionIva: '49400',
      cotizacionTotal: '309400',
      cotizacionFecha: '2026-03-10',
      cotizacionObservaciones: 'Borrar codigos y probar ruta.',
      tecnico: 'Camilo Rojas',
      conservarPiezas: 'No',
      firmaAutoriza: 'Laura Martinez',
      fechaAutoriza: '2026-03-11',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: 'Si',
      medioAprobacion: 'WhatsApp',
      trabajoRealizado: '',
      piezasCambiadas: '',
      observacionesEntrega: '',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2005',
    placa: 'MNO654',
    cliente: 'Constructora Delta SAS',
    telefono: '6013322110',
    vehiculo: 'Toyota Hilux 2021',
    empresa: 'Constructora Delta SAS',
    stepIndex: 4,
    paso: 'Ejecución (Taller)',
    status: 'active',
    updatedAt: '2026-03-11T10:40:00.000Z',
    history: [],
    form: {
      ordenNo: '2005',
      fechaEntrada: '2026-03-09',
      fechaEntrega: '2026-03-12',
      propietario: 'Constructora Delta SAS',
      nit: '900221100',
      telefono: '6013322110',
      email: 'flota@delta.com',
      facturaNombre: 'Constructora Delta SAS',
      formaPago: 'Transferencia',
      formaPagoOtro: '',
      bancoTransferencia: 'Daviplata',
      pagoDias: '',
      placa: 'MNO654',
      marca: 'Toyota Hilux',
      modelo: '2021',
      color: 'Plata',
      empresa: 'Constructora Delta SAS',
      direccion: 'Parque Empresarial Lote 8',
      soatFV: '2026-05-11',
      rtmFV: '2026-05-30',
      kilometraje: '98000',
      combustible: '50%',
      fallaCliente: 'Suspension delantera golpea.',
      observaciones: 'Vehiculo de operacion minera.',
      inventario: {},
      inventarioNotas: '',
      condicionFisica: 'Polvo general y desgaste de platones.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2005',
      cotizacionCondiciones: 'Pago por transferencia.',
      cotizacionItems: [
        {
          sistema: 'Suspension',
          trabajo: 'Cambio bujes y revision amortiguadores',
          precio: '780000',
          cantidad: '1',
          total: '780000',
        },
      ],
      cotizacionSubtotal: '780000',
      cotizacionIva: '148200',
      cotizacionTotal: '928200',
      cotizacionFecha: '2026-03-10',
      cotizacionObservaciones: '',
      tecnico: 'Felipe Cardenas',
      conservarPiezas: 'Si',
      firmaAutoriza: 'Constructora Delta SAS',
      fechaAutoriza: '2026-03-10',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: 'Si',
      medioAprobacion: 'Correo',
      trabajoRealizado: 'Desmonte de suspension y cambio de bujes delanteros.',
      piezasCambiadas: 'Bujes tijera, amortiguador delantero derecho.',
      observacionesEntrega: '',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2006',
    placa: 'PQR987',
    cliente: 'Sofia Ramirez',
    telefono: '3157778899',
    vehiculo: 'Hyundai i20 2017',
    empresa: 'Particular',
    stepIndex: 5,
    paso: 'Entrega / Cierre (Admin)',
    status: 'active',
    updatedAt: '2026-03-11T10:50:00.000Z',
    history: [],
    form: {
      ordenNo: '2006',
      fechaEntrada: '2026-03-08',
      fechaEntrega: '2026-03-11',
      propietario: 'Sofia Ramirez',
      nit: '1029988776',
      telefono: '3157778899',
      email: 'sofia.ram@gmail.com',
      facturaNombre: 'Sofia Ramirez',
      formaPago: 'Tarjeta',
      formaPagoOtro: '',
      bancoTransferencia: '',
      pagoDias: '',
      placa: 'PQR987',
      marca: 'Hyundai i20',
      modelo: '2017',
      color: 'Azul',
      empresa: 'Particular',
      direccion: 'Calle 140 # 9-20',
      soatFV: '2026-04-21',
      rtmFV: '2026-10-09',
      kilometraje: '73450',
      combustible: '25%',
      fallaCliente: 'Aire acondicionado no enfria.',
      observaciones: '',
      inventario: {},
      inventarioNotas: '',
      condicionFisica: 'Buen estado general.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2006',
      cotizacionCondiciones: 'Pago con tarjeta.',
      cotizacionItems: [
        {
          sistema: 'A/C',
          trabajo: 'Carga de gas y reparacion fuga',
          precio: '350000',
          cantidad: '1',
          total: '350000',
        },
      ],
      cotizacionSubtotal: '350000',
      cotizacionIva: '66500',
      cotizacionTotal: '416500',
      cotizacionFecha: '2026-03-09',
      cotizacionObservaciones: '',
      tecnico: 'Jhon Mora',
      conservarPiezas: 'No',
      firmaAutoriza: 'Sofia Ramirez',
      fechaAutoriza: '2026-03-09',
      firmaRecibe: 'Sofia Ramirez',
      fechaRecibe: '2026-03-11',
      aprobadoCliente: 'Si',
      medioAprobacion: 'Llamada',
      trabajoRealizado: 'Sellado de fuga y recarga de refrigerante.',
      piezasCambiadas: 'Valvula de servicio.',
      observacionesEntrega: 'Se entrega funcionando correctamente.',
      fechaEntregaReal: '2026-03-11',
    },
  },
  {
    id: 'os-2007',
    placa: 'STU159',
    cliente: 'Constructora Delta SAS',
    telefono: '6012213344',
    vehiculo: 'Nissan Frontier 2022',
    empresa: 'Constructora Delta SAS',
    stepIndex: 1,
    paso: 'Diagnóstico / Cotización interna',
    status: 'active',
    updatedAt: '2026-03-11T11:00:00.000Z',
    history: [],
    form: {
      ordenNo: '2007',
      fechaEntrada: '2026-03-11',
      fechaEntrega: '2026-03-14',
      propietario: 'Constructora Delta SAS',
      nit: '901998877',
      telefono: '6012213344',
      email: 'flota@delta.com',
      facturaNombre: 'Constructora Delta SAS',
      formaPago: 'Credito',
      formaPagoOtro: '',
      bancoTransferencia: '',
      pagoDias: '15',
      placa: 'STU159',
      marca: 'Nissan Frontier',
      modelo: '2022',
      color: 'Negro',
      empresa: 'Constructora Delta SAS',
      direccion: 'Zona Franca Local 22',
      soatFV: '2026-09-30',
      rtmFV: '2026-12-01',
      kilometraje: '45120',
      combustible: '75%',
      fallaCliente: 'Luces delanteras intermitentes fallan.',
      observaciones: '',
      inventario: {},
      inventarioNotas: '',
      condicionFisica: 'Excelente estado.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2007',
      cotizacionCondiciones: 'Credito a 15 dias.',
      cotizacionItems: [
        {
          sistema: 'Electrico',
          trabajo: 'Revision ramal frontal',
          precio: '120000',
          cantidad: '1',
          total: '120000',
        },
      ],
      cotizacionSubtotal: '120000',
      cotizacionIva: '22800',
      cotizacionTotal: '142800',
      cotizacionFecha: '2026-03-11',
      cotizacionObservaciones: '',
      tecnico: 'Oscar Pena',
      conservarPiezas: 'No',
      firmaAutoriza: '',
      fechaAutoriza: '',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: '',
      medioAprobacion: '',
      trabajoRealizado: 'Pendiente diagnostico electrico.',
      piezasCambiadas: '',
      observacionesEntrega: '',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2008',
    placa: 'VWX753',
    cliente: 'Pedro Salazar',
    telefono: '3171112233',
    vehiculo: 'Ford Fiesta 2015',
    empresa: 'Particular',
    stepIndex: 4,
    paso: 'Ejecución (Taller)',
    status: 'active',
    updatedAt: '2026-03-11T11:10:00.000Z',
    history: [],
    form: {
      ordenNo: '2008',
      fechaEntrada: '2026-03-10',
      fechaEntrega: '2026-03-13',
      propietario: 'Pedro Salazar',
      nit: '79888776',
      telefono: '3171112233',
      email: 'pedrosalazar@gmail.com',
      facturaNombre: 'Pedro Salazar',
      formaPago: 'Efectivo',
      formaPagoOtro: '',
      bancoTransferencia: '',
      pagoDias: '',
      placa: 'VWX753',
      marca: 'Ford Fiesta',
      modelo: '2015',
      color: 'Negro',
      empresa: 'Particular',
      direccion: 'Cra 80 # 26-14',
      soatFV: '2026-11-15',
      rtmFV: '2026-07-22',
      kilometraje: '127800',
      combustible: '25%',
      fallaCliente: 'Direccion dura al girar.',
      observaciones: '',
      inventario: {},
      inventarioNotas: '',
      condicionFisica: 'Desgaste de pintura en capo.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2008',
      cotizacionCondiciones: 'Pago en efectivo.',
      cotizacionItems: [
        {
          sistema: 'Direccion',
          trabajo: 'Cambio bomba hidraulica',
          precio: '690000',
          cantidad: '1',
          total: '690000',
        },
      ],
      cotizacionSubtotal: '690000',
      cotizacionIva: '131100',
      cotizacionTotal: '821100',
      cotizacionFecha: '2026-03-10',
      cotizacionObservaciones: '',
      tecnico: 'Miguel Ariza',
      conservarPiezas: 'Si',
      firmaAutoriza: 'Pedro Salazar',
      fechaAutoriza: '2026-03-10',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: 'Si',
      medioAprobacion: 'WhatsApp',
      trabajoRealizado: 'Desmonte bomba y purga sistema.',
      piezasCambiadas: 'Bomba hidraulica.',
      observacionesEntrega: '',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2009',
    placa: 'YZA852',
    cliente: 'Inversiones Prisma SAS',
    telefono: '6019987766',
    vehiculo: 'Suzuki Swift 2023',
    empresa: 'Inversiones Prisma SAS',
    stepIndex: 0,
    paso: 'Recepción (Ingreso)',
    status: 'active',
    updatedAt: '2026-03-11T11:20:00.000Z',
    history: [],
    form: {
      ordenNo: '2009',
      fechaEntrada: '2026-03-11',
      fechaEntrega: '2026-03-12',
      propietario: 'Inversiones Prisma SAS',
      nit: '901443322',
      telefono: '6019987766',
      email: 'soporte@prisma.com',
      facturaNombre: 'Inversiones Prisma SAS',
      formaPago: 'Transferencia',
      formaPagoOtro: '',
      bancoTransferencia: 'Nequi',
      pagoDias: '',
      placa: 'YZA852',
      marca: 'Suzuki Swift',
      modelo: '2023',
      color: 'Gris plata',
      empresa: 'Inversiones Prisma SAS',
      direccion: 'Calle 72 # 7-10',
      soatFV: '2026-12-31',
      rtmFV: '2027-01-01',
      kilometraje: '18900',
      combustible: '100%',
      fallaCliente: 'Golpe leve en puerta derecha.',
      observaciones: 'Cliente decide no continuar.',
      inventario: {},
      inventarioNotas: '',
      condicionFisica: 'Excelente estado general salvo golpe lateral.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2009',
      cotizacionCondiciones: '',
      cotizacionItems: [
        {
          sistema: 'Latoneria',
          trabajo: 'Desabollar y pintar puerta derecha',
          precio: '580000',
          cantidad: '1',
          total: '580000',
        },
      ],
      cotizacionSubtotal: '580000',
      cotizacionIva: '110200',
      cotizacionTotal: '690200',
      cotizacionFecha: '2026-03-11',
      cotizacionObservaciones: 'Cancelado por cliente.',
      tecnico: '',
      conservarPiezas: '',
      firmaAutoriza: '',
      fechaAutoriza: '',
      firmaRecibe: '',
      fechaRecibe: '',
      aprobadoCliente: 'No',
      medioAprobacion: 'Llamada',
      trabajoRealizado: '',
      piezasCambiadas: '',
      observacionesEntrega: 'Orden cancelada.',
      fechaEntregaReal: '',
    },
  },
  {
    id: 'os-2010',
    placa: 'BCD246',
    cliente: 'Natalia Torres',
    telefono: '3124455667',
    vehiculo: 'Volkswagen Gol 2014',
    empresa: 'Particular',
    stepIndex: 5,
    paso: 'Entrega / Cierre (Admin)',
    status: 'active',
    updatedAt: '2026-03-11T11:30:00.000Z',
    history: [],
    form: {
      ordenNo: '2010',
      fechaEntrada: '2026-03-07',
      fechaEntrega: '2026-03-11',
      propietario: 'Natalia Torres',
      nit: '1033445566',
      telefono: '3124455667',
      email: 'nataliat@gmail.com',
      facturaNombre: 'Natalia Torres',
      formaPago: 'Otro',
      formaPagoOtro: 'QR',
      bancoTransferencia: '',
      pagoDias: '',
      placa: 'BCD246',
      marca: 'Volkswagen Gol',
      modelo: '2014',
      color: 'Verde',
      empresa: 'Particular',
      direccion: 'Barrio Modelia 23-45',
      soatFV: '2026-06-18',
      rtmFV: '2026-09-09',
      kilometraje: '143000',
      combustible: '0%',
      fallaCliente: 'Fuga de aceite y ruido en motor.',
      observaciones: '',
      inventario: {},
      inventarioNotas: '',
      condicionFisica: 'Interior limpio, pintura desgastada.',
      fotosVehiculo: [],
      cotizacionNumero: 'COT-2010',
      cotizacionCondiciones: 'Pago por QR a la entrega.',
      cotizacionItems: [
        {
          sistema: 'Motor',
          trabajo: 'Cambio empaque tapa valvulas y aceite',
          precio: '310000',
          cantidad: '1',
          total: '310000',
        },
      ],
      cotizacionSubtotal: '310000',
      cotizacionIva: '58900',
      cotizacionTotal: '368900',
      cotizacionFecha: '2026-03-08',
      cotizacionObservaciones: '',
      tecnico: 'Diego Parra',
      conservarPiezas: 'No',
      firmaAutoriza: 'Natalia Torres',
      fechaAutoriza: '2026-03-08',
      firmaRecibe: 'Natalia Torres',
      fechaRecibe: '2026-03-11',
      aprobadoCliente: 'Si',
      medioAprobacion: 'WhatsApp',
      trabajoRealizado: 'Cambio empaque, lavado de motor y cambio de aceite.',
      piezasCambiadas: 'Empaque tapa valvulas, filtro de aceite.',
      observacionesEntrega: 'Se recomienda volver en 1.000 km para revision.',
      fechaEntregaReal: '2026-03-11',
    },
  },
]

function createSeedPayload() {
  const entries = DATASET.map(item => withMeta(item))
  const storageMap = entries.reduce((acc, item) => {
    acc[item.id] = {
      form: item.form,
      step: item.stepIndex,
      completed: Array.from({ length: item.stepIndex }, (_, index) => index),
    }
    return acc
  }, {})

  return { entries, storageMap }
}

function mergeEntries(existingEntries, seededEntries) {
  const byId = new Map()

  ;(Array.isArray(existingEntries) ? existingEntries : []).forEach(item => {
    if (item?.id) byId.set(item.id, item)
  })

  seededEntries.forEach(item => {
    byId.set(item.id, item)
  })

  return Array.from(byId.values()).sort((a, b) =>
    String(b?.updatedAt || '').localeCompare(String(a?.updatedAt || '')),
  )
}

function mergeStorageMap(existingMap, seededMap) {
  return {
    ...(existingMap && typeof existingMap === 'object' ? existingMap : {}),
    ...seededMap,
  }
}

export const DEMO_PROFILES = [
  {
    id: 'demo-admin',
    label: 'ADMIN - Taller',
    profile: 'administrativo',
  },
  {
    id: 'demo-tech',
    label: 'TECNICO - Taller',
    profile: 'tecnico',
  },
  {
    id: 'demo-client-company',
    label: 'CLIENTE - Constructora Delta SAS',
    profile: 'cliente',
    clientIdentity: CLIENT_COMPANY,
  },
  {
    id: 'demo-admin-full',
    label: 'ADMIN - Dataset completo',
    profile: 'administrativo',
  },
]

function getCurrentEntryForProfile(profile, entries) {
  if (profile === 'cliente') {
    return (
      entries.find(item => CLIENT_COMPANY.plates.includes(item.placa)) || entries[0] || null
    )
  }

  if (profile === 'tecnico') {
    return entries.find(item => item.status === 'active' && item.stepIndex >= 1) || entries[0] || null
  }

  return entries.find(item => item.status === 'active') || entries[0] || null
}

export async function ensureDemoWorkspace(profile = 'administrativo') {
  const existingEntriesRaw = await AsyncStorage.getItem(ENTRIES_KEY)
  const existingMapRaw = await AsyncStorage.getItem(STORAGE_MAP_KEY)
  const existingCurrentRaw = await AsyncStorage.getItem(CURRENT_ENTRY_KEY)

  let existingEntries = []
  let existingMap = {}
  let existingCurrent = null

  try {
    existingEntries = existingEntriesRaw ? JSON.parse(existingEntriesRaw) : []
    if (!Array.isArray(existingEntries)) existingEntries = []
  } catch {
    existingEntries = []
  }

  try {
    existingMap = existingMapRaw ? JSON.parse(existingMapRaw) : {}
    if (!existingMap || typeof existingMap !== 'object') existingMap = {}
  } catch {
    existingMap = {}
  }

  try {
    existingCurrent = existingCurrentRaw ? JSON.parse(existingCurrentRaw) : null
  } catch {
    existingCurrent = null
  }

  const { entries, storageMap } = createSeedPayload()
  const mergedEntries = mergeEntries(existingEntries, entries)
  const mergedMap = mergeStorageMap(existingMap, storageMap)
  const currentEntry =
    existingCurrent && existingCurrent.id
      ? mergedEntries.find(item => item.id === existingCurrent.id) ||
        getCurrentEntryForProfile(profile, mergedEntries)
      : getCurrentEntryForProfile(profile, mergedEntries)

  await AsyncStorage.multiSet([
    [ENTRIES_KEY, JSON.stringify(mergedEntries)],
    [STORAGE_MAP_KEY, JSON.stringify(mergedMap)],
    [CURRENT_ENTRY_KEY, JSON.stringify(currentEntry)],
  ])

  if (profile === 'cliente') {
    await AsyncStorage.setItem(CLIENT_IDENTITY_KEY, JSON.stringify(CLIENT_COMPANY))
  }
}

export async function seedDemoProfile(demoId) {
  const demo = DEMO_PROFILES.find(item => item.id === demoId) || DEMO_PROFILES[0]
  const { entries, storageMap } = createSeedPayload()
  const currentEntry = getCurrentEntryForProfile(demo.profile, entries)

  await AsyncStorage.multiSet([
    [PROFILE_KEY, demo.profile],
    [ENTRIES_KEY, JSON.stringify(entries)],
    [CURRENT_ENTRY_KEY, JSON.stringify(currentEntry)],
    [STORAGE_MAP_KEY, JSON.stringify(storageMap)],
  ])

  if (demo.clientIdentity) {
    await AsyncStorage.setItem(
      CLIENT_IDENTITY_KEY,
      JSON.stringify(demo.clientIdentity),
    )
  }

  return demo
}
