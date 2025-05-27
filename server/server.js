const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TODO',
  password: '2099', // Change this
  port: 5432,
});

cloudinary.config({
  cloud_name: 'dsk34jmvj',
  api_key: '229989196997211',
  api_secret: 'PJP_EDY5adVETUcgpEE2IpmQKBo'
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Test database connection
    pool.query('SELECT 1')
      .then(() => {
        res.status(200).json({ status: 'ok', message: 'Server is running' });
      })
      .catch(err => {
        console.error('Database connection error:', err);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
      });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name, patronymic } = req.body;
  
  try {
    // Basic validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Пожалуйста, заполните все обязательные поля' 
      });
    }

    const result = await pool.query(
      'SELECT register_user($1, $2, $3, $4, $5)',
      [email, password, first_name, last_name, patronymic || '']
    );
    
    res.json({ 
      success: true, 
      userId: result.rows[0].register_user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    } else if (error.code === '23514') { // Check constraint violation
      res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже' 
      });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Пожалуйста, заполните все поля' 
      });
    }

    const authResult = await pool.query(
      'SELECT * FROM authenticate_user($1, $2)',
      [email, password]
    );
    
    if (authResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный email или пароль' 
      });
    }

    // Get additional user data
    const userData = await pool.query(
      `SELECT 
        user_id, 
        first_name, 
        last_name, 
        patronymic,
        email,
        profile_image,
        organization_id,
        full_cup_count,
        now_cup_count,
        purpose_cup_count,
        role,
        status
      FROM "User" 
      WHERE user_id = $1`,
      [authResult.rows[0].user_id]
    );

    // Update last login
    await pool.query(
      'UPDATE "User" SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [authResult.rows[0].user_id]
    );
    
    res.json({ 
      success: true, 
      user: userData.rows[0]
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при авторизации' 
    });
  }
});

app.get('/api/search', async (req, res) => {
  const { query, filter } = req.query;
  
  if (!query || query.length < 2) {
    return res.json({ success: true, results: [] });
  }

  try {
    let results = [];
    
    if (filter === 'users' || filter === 'all') {
      const users = await pool.query(
        'SELECT * FROM search_users($1)',
        [query]
      );
      results = [...results, ...users.rows];
    }
    
    if (filter === 'organizations' || filter === 'all') {
      const orgs = await pool.query(
        'SELECT * FROM search_organizations($1)',
        [query]
      );
      results = [...results, ...orgs.rows];
    }

    // Сортировка результатов: точные совпадения первыми
    results.sort((a, b) => {
      const aName = a.first_name ? `${a.first_name} ${a.last_name}` : a.organization_name;
      const bName = b.first_name ? `${b.first_name} ${b.last_name}` : b.organization_name;
      
      const aExact = aName.toLowerCase().includes(query.toLowerCase());
      const bExact = bName.toLowerCase().includes(query.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
    
    res.json({ 
      success: true, 
      results,
      total: results.length,
      filter
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при поиске' 
    });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userQuery = await pool.query(
      `SELECT u.*, p.post_name 
       FROM "User" u 
       LEFT JOIN Positions p ON u.post_id = p.post_id 
       WHERE u.user_id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден' 
      });
    }

    res.json({ 
      success: true, 
      user: userQuery.rows[0] 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении данных пользователя' 
    });
  }
});

app.get('/api/organizations/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const orgQuery = await pool.query(
      'SELECT * FROM Organization WHERE organization_id = $1',
      [orgId]
    );

    if (orgQuery.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Организация не найдена' 
      });
    }

    res.json({ 
      success: true, 
      organization: orgQuery.rows[0] 
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении данных организации' 
    });
  }
});

app.post('/api/organizations', async (req, res) => {
  const { name, description, adminId } = req.body;
  
  try {
    // Basic validation
    if (!name || !adminId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Название организации обязательно' 
      });
    }

    const result = await pool.query(
      'INSERT INTO Organization (organization_name, description, admin_id) VALUES ($1, $2, $3) RETURNING organization_id',
      [name, description, adminId]
    );
    
    // Update user's organization_id
    await pool.query(
      'UPDATE "User" SET organization_id = $1, role = \'Admin\' WHERE user_id = $2',
      [result.rows[0].organization_id, adminId]
    );

    res.json({ 
      success: true, 
      organizationId: result.rows[0].organization_id 
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при создании организации' 
    });
  }
});

app.put('/api/organizations/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const { name, description, website } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE Organization 
       SET organization_name = $1, 
           description = $2, 
           website = $3
       WHERE organization_id = $4
       RETURNING *`,
      [name, description, website, orgId]
    );
    
    res.json({ 
      success: true, 
      organization: result.rows[0] 
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при обновлении организации' 
    });
  }
});

app.delete('/api/organizations/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete all organization requests first
    await client.query(
      'DELETE FROM OrganizationRequests WHERE organization_id = $1',
      [orgId]
    );

    // Update users' organization_id to null
    await client.query(
      'UPDATE "User" SET organization_id = NULL, role = \'User\' WHERE organization_id = $1',
      [orgId]
    );
    
    // Delete the organization
    await client.query(
      'DELETE FROM Organization WHERE organization_id = $1',
      [orgId]
    );
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete organization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при удалении организации' 
    });
  } finally {
    client.release();
  }
});

app.get('/api/organizations/:orgId/participants', async (req, res) => {
  const { orgId } = req.params;
  const { query } = req.query;
  
  try {
    let queryText = `
      SELECT u.user_id, u.first_name, u.last_name, u.profile_image, u.role, p.post_name
      FROM "User" u
      LEFT JOIN Positions p ON u.post_id = p.post_id
      WHERE u.organization_id = $1
    `;
    
    const params = [orgId];
    
    if (query) {
      queryText += ` AND (
        LOWER(u.first_name) LIKE LOWER($2) OR
        LOWER(u.last_name) LIKE LOWER($2)
      )`;
      params.push(`%${query}%`);
    }
    
    const result = await pool.query(queryText, params);
    
    res.json({ 
      success: true, 
      participants: result.rows 
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении списка участников' 
    });
  }
});

// Check if user has pending request
app.get('/api/organizations/:orgId/check-request/:userId', async (req, res) => {
  const { orgId, userId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM OrganizationRequests WHERE organization_id = $1 AND user_id = $2 AND status = \'pending\'',
      [orgId, userId]
    );
    
    res.json({ 
      success: true, 
      hasPendingRequest: result.rows.length > 0 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Submit request to join organization
app.post('/api/organizations/:orgId/request', async (req, res) => {
  const { orgId } = req.params;
  const { userId } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO OrganizationRequests (user_id, organization_id) VALUES ($1, $2)',
      [userId, orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Leave organization
app.post('/api/organizations/:orgId/leave', async (req, res) => {
  const { orgId } = req.params;
  const { userId } = req.body;
  
  try {
    await pool.query(
      'UPDATE "User" SET organization_id = NULL, role = \'User\' WHERE user_id = $1 AND organization_id = $2',
      [userId, orgId]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get organization requests
app.get('/api/organizations/:orgId/requests', async (req, res) => {
  const { orgId } = req.params;
  const { query } = req.query;
  
  try {
    let queryText = `
      SELECT r.*, u.first_name, u.last_name, u.profile_image, u.email
      FROM OrganizationRequests r
      JOIN "User" u ON r.user_id = u.user_id
      WHERE r.organization_id = $1 AND r.status = 'pending'
    `;
    
    const params = [orgId];
    
    if (query) {
      queryText += ` AND (
        LOWER(u.first_name) LIKE LOWER($2) OR
        LOWER(u.last_name) LIKE LOWER($2)
      )`;
      params.push(`%${query}%`);
    }
    
    queryText += ' ORDER BY u.first_name, u.last_name';
    
    const result = await pool.query(queryText, params);
    
    res.json({ 
      success: true, 
      requests: result.rows 
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Accept request
app.post('/api/organizations/requests/:requestId/accept', async (req, res) => {
  const { requestId } = req.params;
  
  try {
    const request = await pool.query(
      'SELECT * FROM OrganizationRequests WHERE request_id = $1',
      [requestId]
    );
    
    if (request.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    await pool.query('BEGIN');
    
    // Update request status
    await pool.query(
      'UPDATE OrganizationRequests SET status = $1 WHERE request_id = $2',
      ['accepted', requestId]
    );
    
    // Update user organization
    await pool.query(
      'UPDATE "User" SET organization_id = $1 WHERE user_id = $2',
      [request.rows[0].organization_id, request.rows[0].user_id]
    );
    
    await pool.query('COMMIT');
    
    res.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error accepting request:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reject request
app.post('/api/organizations/requests/:requestId/reject', async (req, res) => {
  const { requestId } = req.params;
  
  try {
    await pool.query(
      'UPDATE OrganizationRequests SET status = $1 WHERE request_id = $2',
      ['rejected', requestId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Promote user to admin
app.post('/api/organizations/:orgId/promote', async (req, res) => {
  const { orgId } = req.params;
  const { userId } = req.body;
  
  try {
    await pool.query(
      'UPDATE "User" SET role = \'Admin\' WHERE user_id = $1 AND organization_id = $2',
      [userId, orgId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Remove user from organization
app.post('/api/organizations/:orgId/remove-user', async (req, res) => {
  const { orgId } = req.params;
  const { userId } = req.body;
  
  try {
    await pool.query(
      'UPDATE "User" SET organization_id = NULL, role = \'User\' WHERE user_id = $1 AND organization_id = $2',
      [userId, orgId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Toggle manager role
app.post('/api/organizations/:orgId/toggle-manager', async (req, res) => {
  const { orgId } = req.params;
  const { userId, isManager } = req.body;
  
  try {
    const newRole = isManager ? 'Manager' : 'User';
    await pool.query(
      'UPDATE "User" SET role = $1 WHERE user_id = $2 AND organization_id = $3 AND role != \'Admin\'',
      [newRole, userId, orgId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.put('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { first_name, last_name, patronymic, email, current_password, new_password } = req.body;
  
  try {
    // If changing password, verify current password
    if (new_password) {
      const verifyResult = await pool.query(
        'SELECT * FROM authenticate_user($1, $2)',
        [email, current_password]
      );
      
      if (verifyResult.rows.length === 0) {
        return res.status(401).json({ 
          success: false, 
          error: 'Неверный текущий пароль' 
        });
      }
    }

    let updateQuery = `
      UPDATE "User" 
      SET first_name = $1, 
          last_name = $2, 
          patronymic = $3, 
          email = $4
    `;
    let params = [first_name, last_name, patronymic, email];

    if (new_password) {
      updateQuery += `, password = crypt($5, gen_salt('bf'))`;
      params.push(new_password);
    }

    updateQuery += ` WHERE user_id = $${params.length + 1} RETURNING *`;
    params.push(userId);

    const result = await pool.query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.put('/api/users/:userId/profile-image', async (req, res) => {
  const { userId } = req.params;
  const { image } = req.body;
  
  try {
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'profile_images',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Update user profile_image in database
    const result = await pool.query(
      'UPDATE "User" SET profile_image = $1 WHERE user_id = $2 RETURNING *',
      [uploadResponse.secure_url, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ 
      success: true, 
      user: result.rows[0],
      profile_image: uploadResponse.secure_url 
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при обновлении фото. Пожалуйста, попробуйте ещё раз' 
    });
  }
});

app.get('/api/organizations/:orgId/members/search', async (req, res) => {
  const { orgId } = req.params;
  const { query } = req.query;
  
  try {
    if (!query || query.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const searchQuery = `
      SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.profile_image,
        p.post_name
      FROM "User" u
      LEFT JOIN Positions p ON u.post_id = p.post_id
      WHERE u.organization_id = $1
        AND (
          LOWER(u.first_name) LIKE LOWER($2) OR 
          LOWER(u.last_name) LIKE LOWER($2) OR
          LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($2)
        )
      LIMIT 10`;

    const result = await pool.query(searchQuery, [orgId, `%${query}%`]);
    
    res.json({ 
      success: true, 
      users: result.rows
    });
  } catch (error) {
    console.error('Search members error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при поиске пользователей' 
    });
  }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
  const { 
    title,
    description,
    organization_id,
    creator_id,
    performers,
    subtasks,
    start_date,
    finish_date,
    reward_points,
    images
  } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create main task
    const taskResult = await client.query(
      `INSERT INTO Tasks (
        task_title,
        task_description,
        organization_id,
        task_creater_id,
        start_date,
        finish_date,
        status,
        reward_points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING task_id`,
      [title, description, organization_id, creator_id, start_date, finish_date, 'open', reward_points]
    );

    const taskId = taskResult.rows[0].task_id;

    // Add performers
    for (const performerId of performers) {
      await client.query(
        'INSERT INTO Performers (performer_id, task_id) VALUES ($1, $2)',
        [performerId, taskId]
      );
    }

    // Add subtasks
    for (const subtask of subtasks) {
      await client.query(
        'INSERT INTO Subtasks (task_id, title, description) VALUES ($1, $2, $3)',
        [taskId, subtask.title, subtask.description]
      );
    }

    // Upload and save images
    if (images && images.length > 0) {
      for (const image of images) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'task_images',
          transformation: [
            { quality: 'auto' }
          ]
        });

        await client.query(
          'INSERT INTO TaskImages (task_id, image_url) VALUES ($1, $2)',
          [taskId, uploadResponse.secure_url]
        );
      }
    }

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      task_id: taskId 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create task error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при создании задания' 
    });
  } finally {
    client.release();
  }
});

app.get('/api/tasks', async (req, res) => {
  const { userId, period, startDate, endDate } = req.query;
  
  try {
    let dateCondition = '';
    const params = [userId];
    
    switch (period) {
      case 'today':
        dateCondition = 'AND DATE(t.start_date) <= CURRENT_DATE AND DATE(t.finish_date) >= CURRENT_DATE';
        break;
      case 'yesterday':
        dateCondition = 'AND DATE(t.start_date) <= CURRENT_DATE - INTERVAL \'1 day\' AND DATE(t.finish_date) >= CURRENT_DATE - INTERVAL \'1 day\'';
        break;
      case 'week':
        dateCondition = 'AND DATE(t.start_date) <= CURRENT_DATE + INTERVAL \'7 days\' AND DATE(t.finish_date) >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'period':
        if (startDate && endDate) {
          dateCondition = 'AND DATE(t.start_date) >= $2 AND DATE(t.finish_date) <= $3';
          params.push(startDate, endDate);
        }
        break;
    }

    const query = `
      SELECT DISTINCT ON (t.task_id)
        t.*,
        COALESCE(
          (
            SELECT json_agg(s)
            FROM Subtasks s
            WHERE s.task_id = t.task_id
          ),
          '[]'::json
        ) as subtasks,
        COALESCE(
          (
            SELECT json_agg(ti.image_url)
            FROM TaskImages ti
            WHERE ti.task_id = t.task_id
          ),
          '[]'::json
        ) as images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'user_id', u.user_id,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'profile_image', u.profile_image
              )
            )
            FROM Performers p2
            JOIN "User" u ON p2.performer_id = u.user_id
            WHERE p2.task_id = t.task_id
          ),
          '[]'::json
        ) as performers,
        uc.first_name as creator_first_name,
        uc.last_name as creator_last_name,
        uc.profile_image as creator_profile_image
      FROM Tasks t
      LEFT JOIN "User" uc ON t.task_creater_id = uc.user_id
      LEFT JOIN Performers p ON t.task_id = p.task_id
      WHERE (p.performer_id = $1 OR t.task_creater_id = $1)
      ${dateCondition}
      ORDER BY t.task_id, t.created_at DESC
    `;

    const result = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      tasks: result.rows 
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении заданий' 
    });
  }
});

app.get('/api/tasks/all', async (req, res) => {
  const { period, startDate, endDate } = req.query;
  
  try {
    let dateCondition = '';
    const params = [];
    
    switch (period) {
      case 'today':
        dateCondition = 'WHERE DATE(t.start_date) <= CURRENT_DATE AND DATE(t.finish_date) >= CURRENT_DATE';
        break;
      case 'yesterday':
        dateCondition = 'WHERE DATE(t.start_date) <= CURRENT_DATE - INTERVAL \'1 day\' AND DATE(t.finish_date) >= CURRENT_DATE - INTERVAL \'1 day\'';
        break;
      case 'week':
        dateCondition = 'WHERE DATE(t.start_date) <= CURRENT_DATE + INTERVAL \'7 days\' AND DATE(t.finish_date) >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'period':
        if (startDate && endDate) {
          dateCondition = 'WHERE DATE(t.start_date) >= $1 AND DATE(t.finish_date) <= $2';
          params.push(startDate, endDate);
        }
        break;
    }

    const query = `
      SELECT DISTINCT ON (t.task_id)
        t.*,
        COALESCE(
          (
            SELECT json_agg(s)
            FROM Subtasks s
            WHERE s.task_id = t.task_id
          ),
          '[]'::json
        ) as subtasks,
        COALESCE(
          (
            SELECT json_agg(ti.image_url)
            FROM TaskImages ti
            WHERE ti.task_id = t.task_id
          ),
          '[]'::json
        ) as images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'user_id', u.user_id,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'profile_image', u.profile_image
              )
            )
            FROM Performers p2
            JOIN "User" u ON p2.performer_id = u.user_id
            WHERE p2.task_id = t.task_id
          ),
          '[]'::json
        ) as performers,
        uc.first_name as creator_first_name,
        uc.last_name as creator_last_name,
        uc.profile_image as creator_profile_image
      FROM Tasks t
      LEFT JOIN "User" uc ON t.task_creater_id = uc.user_id
      ${dateCondition}
      ORDER BY t.task_id, t.created_at DESC
    `;

    const result = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      tasks: result.rows 
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении заданий' 
    });
  }
});

// Get task details
app.get('/api/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const query = `
      SELECT 
        t.*,
        COALESCE(
          (
            SELECT json_agg(s)
            FROM Subtasks s
            WHERE s.task_id = t.task_id
          ),
          '[]'::json
        ) as subtasks,
        COALESCE(
          (
            SELECT json_agg(ti.image_url)
            FROM TaskImages ti
            WHERE ti.task_id = t.task_id
          ),
          '[]'::json
        ) as images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'user_id', u.user_id,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'profile_image', u.profile_image
              )
            )
            FROM Performers p2
            JOIN "User" u ON p2.performer_id = u.user_id
            WHERE p2.task_id = t.task_id
          ),
          '[]'::json
        ) as performers,
        uc.first_name as creator_first_name,
        uc.last_name as creator_last_name,
        uc.profile_image as creator_profile_image
      FROM Tasks t
      LEFT JOIN "User" uc ON t.task_creater_id = uc.user_id
      WHERE t.task_id = $1
    `;

    const result = await pool.query(query, [taskId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching task details'
    });
  }
});

// Start task
app.post('/api/tasks/:taskId/start', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    await pool.query(
      'UPDATE Tasks SET status = $1 WHERE task_id = $2',
      ['in_progress', taskId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error starting task:', error);
    res.status(500).json({
      success: false,
      error: 'Error starting task'
    });
  }
});

// Complete subtask
app.post('/api/tasks/:taskId/subtasks/:subtaskId/complete', async (req, res) => {
  const { taskId, subtaskId } = req.params;
  
  try {
    await pool.query(
      'UPDATE Subtasks SET status = $1 WHERE subtask_id = $2 AND task_id = $3',
      ['completed', subtaskId, taskId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing subtask:', error);
    res.status(500).json({
      success: false,
      error: 'Error completing subtask'
    });
  }
});

// Toggle subtask status
app.post('/api/tasks/:taskId/subtasks/:subtaskId/toggle', async (req, res) => {
  const { taskId, subtaskId } = req.params;
  const { status } = req.body;
  
  try {
    // Check if task is in progress
    const taskCheck = await pool.query(
      'SELECT status FROM Tasks WHERE task_id = $1',
      [taskId]
    );
    
    if (taskCheck.rows[0]?.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Task must be in progress to modify subtasks'
      });
    }

    await pool.query(
      'UPDATE Subtasks SET status = $1 WHERE subtask_id = $2 AND task_id = $3',
      [status, subtaskId, taskId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling subtask:', error);
    res.status(500).json({
      success: false,
      error: 'Error toggling subtask'
    });
  }
});

// Complete task
app.post('/api/tasks/:taskId/complete', async (req, res) => {
  const { taskId } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if all subtasks are completed
    const subtasks = await client.query(
      'SELECT status FROM Subtasks WHERE task_id = $1',
      [taskId]
    );
    
    const allCompleted = subtasks.rows.every(s => s.status === 'completed');
    
    if (!allCompleted) {
      return res.status(400).json({
        success: false,
        error: 'All subtasks must be completed first'
      });
    }

    // Get task details including reward points
    const taskDetails = await client.query(
      'SELECT reward_points FROM Tasks WHERE task_id = $1',
      [taskId]
    );

    const rewardPoints = taskDetails.rows[0].reward_points;

    // Get all performers for this task
    const performers = await client.query(
      'SELECT performer_id FROM Performers WHERE task_id = $1',
      [taskId]
    );

    // Update cups for each performer
    for (const performer of performers.rows) {
      await client.query(
        `UPDATE "User" 
         SET full_cup_count = full_cup_count + $1,
             now_cup_count = now_cup_count + $1
         WHERE user_id = $2`,
        [rewardPoints, performer.performer_id]
      );

      // Check if user reached their purpose
      const userCups = await client.query(
        `SELECT now_cup_count, purpose_cup_count 
         FROM "User" 
         WHERE user_id = $1`,
        [performer.performer_id]
      );

      // If reached or exceeded purpose, reset now_cup_count
      if (userCups.rows[0].now_cup_count >= userCups.rows[0].purpose_cup_count && 
          userCups.rows[0].purpose_cup_count > 0) {
        await client.query(
          `UPDATE "User" 
           SET now_cup_count = 0
           WHERE user_id = $1`,
          [performer.performer_id]
        );
      }
    }

    // Mark task as completed
    await client.query(
      'UPDATE Tasks SET status = $1 WHERE task_id = $2',
      ['completed', taskId]
    );
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: 'Error completing task'
    });
  } finally {
    client.release();
  }
});

// Delete task
app.delete('/api/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete subtasks
    await client.query('DELETE FROM Subtasks WHERE task_id = $1', [taskId]);
    
    // Delete performers
    await client.query('DELETE FROM Performers WHERE task_id = $1', [taskId]);
    
    // Delete images
    await client.query('DELETE FROM TaskImages WHERE task_id = $1', [taskId]);
    
    // Delete task
    await client.query('DELETE FROM Tasks WHERE task_id = $1', [taskId]);
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении задания'
    });
  } finally {
    client.release();
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
