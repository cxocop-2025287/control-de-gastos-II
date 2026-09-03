import bcrypt from 'bcryptjs';
import database from '../config/database';
import { UserModel } from '../models/user.model';
import { Role } from '../types/auth.types';

const seedUsers = async (): Promise<void> => {
  try {
    console.log('Conectando a PostgreSQL...');
    await database.initialize();
    console.log('Conexion establecida');

    const users = [
      {
        name: 'Usuario Demo',
        password: process.env.SEED_USER_PASSWORD || 'usuario123',
        role: Role.USER,
        is_active: true,
      },
      {
        name: 'Administrador Demo',
        password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
        role: Role.ADMIN,
        is_active: true,
      },
    ];

    const saltRounds = 10;

    for (const userData of users) {
      const existing = await UserModel.findByName(userData.name);

      if (existing) {
        console.log(`El usuario "${userData.name}" ya existe. Eliminando para recrear...`);
        await database.query('DELETE FROM users WHERE name = $1', [userData.name]);
      }

      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      const created = await UserModel.create({
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        is_active: userData.is_active,
      });

      console.log(`Usuario "${created.name}" creado (ID: ${created.id}, Rol: ${created.role})`);
    }

    const allUsers = await UserModel.findAll();
    console.log('\nUsuarios en la base de datos:');
    allUsers.forEach((u) => {
      console.log(`  - ${u.name} | Rol: ${u.role} | Activo: ${u.is_active} | ID: ${u.id}`);
    });

    console.log('\nCredenciales de prueba:');
    console.log('  - Usuario Demo (USER) | Contrasena: usuario123');
    console.log('  - Administrador Demo (ADMIN) | Contrasena: admin123');

    await database.close();
    console.log('\nDesconectado de PostgreSQL');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el seed:', error);
    await database.close();
    process.exit(1);
  }
};

seedUsers();
