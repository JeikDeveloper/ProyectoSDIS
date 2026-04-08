"""
Ejecutar una sola vez para:
  - Crear todas las tablas en la base de datos
  - Cargar las 20 localidades de Bogotá
  - Crear el usuario administrador por defecto
  - Insertar actividades de demostración

Uso:
    cd backend
    python seed.py
"""
import bcrypt
from datetime import date

from app.database import engine, SessionLocal, Base
from app.models import localidad, actividad, usuario  # noqa: importar modelos para que Base los registre
from app.models.localidad import Localidad
from app.models.actividad import Actividad
from app.models.usuario import Usuario

LOCALIDADES = [
    (1,  "Usaquén"),
    (2,  "Chapinero"),
    (3,  "Santa Fe"),
    (4,  "San Cristóbal"),
    (5,  "Usme"),
    (6,  "Tunjuelito"),
    (7,  "Bosa"),
    (8,  "Kennedy"),
    (9,  "Fontibón"),
    (10, "Engativá"),
    (11, "Suba"),
    (12, "Barrios Unidos"),
    (13, "Teusaquillo"),
    (14, "Los Mártires"),
    (15, "Antonio Nariño"),
    (16, "Puente Aranda"),
    (17, "La Candelaria"),
    (18, "Rafael Uribe Uribe"),
    (19, "Ciudad Bolívar"),
    (20, "Sumapaz"),
]

# (localidad, titulo, descripcion, lugar, fecha_inicio, fecha_fin, tipo, organizador)
ACTIVIDADES_DEMO = [
    ("Kennedy", "Taller de Panadería Artesanal", "Aprende técnicas básicas de panadería y elaboración de panes tradicionales colombianos.", "Casa de la Cultura Kennedy, Cra 80 # 38-20", date(2026, 4, 15), date(2026, 4, 17), "Taller", "SENA"),
    ("Kennedy", "Festival de Danza Folclórica", "Presentaciones de grupos locales de danza folclórica de diferentes regiones de Colombia.", "Parque El Tintal, Cll 6C # 113-56", date(2026, 4, 20), None, "Evento", "Secretaría"),
    ("Kennedy", "Feria de Emprendimiento Local", "Espacio para que emprendedores de la localidad exhiban y vendan sus productos.", "Centro Comercial Plaza Imperial, Local Comunal", date(2026, 5, 3), date(2026, 5, 4), "Actividad", "Secretaría"),

    ("Suba", "Curso de Fotografía Digital", "Fundamentos de fotografía con cámara y celular. Incluye práctica en parque.", "Biblioteca Julio Mario Santo Domingo, Sala Talleres", date(2026, 4, 22), date(2026, 4, 24), "Taller", "SENA"),
    ("Suba", "Cine al Parque — Ciclo Familiar", "Proyección de películas para toda la familia bajo las estrellas en el Parque La Gaitana.", "Parque La Gaitana, Suba", date(2026, 4, 19), None, "Evento", "Secretaría"),
    ("Suba", "Taller de Huerta Urbana", "Aprende a cultivar alimentos en espacios pequeños usando técnicas sostenibles.", "Centro Agroecológico Suba, Cll 145 # 91-19", date(2026, 5, 10), date(2026, 5, 11), "Taller", "Otro"),

    ("Chapinero", "Charla: Derechos Digitales y Privacidad", "Sesión informativa sobre protección de datos personales y seguridad en internet.", "Centro Local de Artes para la Niñez, Chapinero", date(2026, 4, 25), None, "Actividad", "Secretaría"),
    ("Chapinero", "Taller de Inglés Conversacional", "Práctica oral de inglés en niveles básico e intermedio para adultos.", "SENA Regional Bogotá, Cll 52 # 13-65", date(2026, 4, 28), date(2026, 5, 30), "Taller", "SENA"),

    ("Usaquén", "Recorrido Patrimonial por Usaquén", "Guía histórico-cultural por el casco antiguo de Usaquén y su plaza principal.", "Plaza de Usaquén, frente a la Alcaldía Local", date(2026, 4, 26), None, "Actividad", "Secretaría"),
    ("Usaquén", "Taller de Tejido y Artesanías", "Técnicas de tejido en telar y macramé con materiales reciclados.", "Casa de la Cultura Usaquén, Cll 119B # 6-10", date(2026, 5, 6), date(2026, 5, 8), "Taller", "Otro"),

    ("Ciudad Bolívar", "Escuela de Fútbol Juvenil", "Programa deportivo para niños y jóvenes entre 8 y 17 años. Inscripción gratuita.", "Estadio El Tunal, Ciudad Bolívar", date(2026, 4, 14), date(2026, 6, 30), "Actividad", "Secretaría"),
    ("Ciudad Bolívar", "Feria de la Salud Comunitaria", "Jornada con brigadas de vacunación, toma de presión, orientación nutricional y más.", "Parque Arborizadora Alta, Cll 69G Sur # 43-12", date(2026, 4, 30), None, "Evento", "Secretaría"),

    ("La Candelaria", "Visita Guiada al Centro Histórico", "Recorrido por el Palacio de Liévano, la Catedral Primada y el Chorro de Quevedo.", "Plaza de Bolívar, frente al Palacio de Liévano", date(2026, 4, 18), None, "Actividad", "Secretaría"),
    ("La Candelaria", "Taller de Restauración de Documentos", "Técnicas básicas de conservación y restauración de documentos y fotografías antiguas.", "Archivo de Bogotá, Cll 6B # 5-36", date(2026, 5, 13), date(2026, 5, 15), "Taller", "SENA"),

    ("Engativá", "Concierto de Música Colombiana", "Presentación de agrupaciones locales de cumbia, vallenato y música andina.", "Parque Álamos, Engativá", date(2026, 4, 27), None, "Evento", "Secretaría"),
    ("Engativá", "Taller de Electricidad Residencial", "Curso práctico de instalaciones eléctricas básicas y mantenimiento del hogar.", "SENA Sede Engativá, Av. Rojas # 68-50", date(2026, 5, 5), date(2026, 5, 9), "Taller", "SENA"),
]


def seed():
    print("Creando tablas...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("Cargando localidades...")
    for codigo, nombre in LOCALIDADES:
        if not db.query(Localidad).filter(Localidad.nombre == nombre).first():
            db.add(Localidad(codigo=codigo, nombre=nombre))
    db.flush()

    print("Creando usuario admin por defecto (usuario: admin / contraseña: admin123)...")
    if not db.query(Usuario).filter(Usuario.nombre_usuario == "admin").first():
        hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        db.add(Usuario(nombre_usuario="admin", password_hash=hashed, activo=True))

    print("Insertando actividades de demostración...")
    if db.query(Actividad).count() == 0:
        for nombre_loc, titulo, descripcion, lugar, f_inicio, f_fin, tipo, organizador in ACTIVIDADES_DEMO:
            loc = db.query(Localidad).filter(Localidad.nombre == nombre_loc).first()
            if loc:
                db.add(Actividad(
                    titulo=titulo,
                    descripcion=descripcion,
                    localidad_id=loc.id,
                    lugar=lugar,
                    fecha_inicio=f_inicio,
                    fecha_fin=f_fin,
                    tipo=tipo,
                    organizador=organizador,
                ))

    db.commit()
    db.close()
    print("Seed completado exitosamente.")


if __name__ == "__main__":
    seed()
