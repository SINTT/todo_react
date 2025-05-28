const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'TODO',
  password: '2099',
  port: 5432,
});

cloudinary.config({
  cloud_name: 'dsk34jmvj',
  api_key: '229989196997211',
  api_secret: 'PJP_EDY5adVETUcgpEE2IpmQKBo'
});

// Проверка работоспособности
app.get('/health', (req, res) => {
  try {
    // Проверка подключения к базе
    pool.query('SELECT 1')
      .then(() => {
        res.status(200).json({ status: 'ok', message: 'Сервер работает' });
      })
      .catch(err => {
        console.error('Ошибка подключения к базе данных:', err);
        res.status(500).json({ status: 'error', message: 'Ошибка подключения к базе данных' });
      });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Ошибка сервера' });
  }
});

// Конечные точки аутентификации
app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name, patronymic } = req.body;
  
  try {

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
    

    if (error.code === '23505') { 
      res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    } else if (error.code === '23514') { 
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


    const userData = await pool.query(
      `SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.patronymic,
        u.email,
        u.profile_image,
        u.organization_id,
        u.full_cup_count,
        u.now_cup_count,
        u.purpose_cup_count,
        u.role,
        u.status,
        p.post_name
      FROM "User" u
      LEFT JOIN Positions p ON u.post_id = p.post_id
      WHERE u.user_id = $1`,
      [authResult.rows[0].user_id]
    );

    // last login
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
  try {
    const orgId = parseInt(req.params.orgId);
    const { query } = req.query;
    
    // Проверяем, что orgId является числом и существует
    if (!orgId || isNaN(orgId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid organization ID' 
      });
    }

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

    // Create chat for task
    const chatResult = await client.query(
      `INSERT INTO Chat (
        chat_name,
        task_id,
        creator_id,
        is_group_chat,
        is_active
      ) VALUES ($1, $2, $3, $4, $5) RETURNING chat_id`,
      [`Task: ${title}`, taskId, creator_id, true, true]
    );

    const chatId = chatResult.rows[0].chat_id;

    // Add performers
    for (const performerId of performers) {
      const existingMember = await client.query(
        'SELECT 1 FROM ChatMembers WHERE chat_id = $1 AND user_id = $2',
        [chatId, performerId]
      );

      if (existingMember.rows.length === 0) {
        await client.query(
          'INSERT INTO ChatMembers (chat_id, user_id) VALUES ($1, $2)',
          [chatId, performerId]
        );
      }

      // Add performer to Performers table
      await client.query(
        'INSERT INTO Performers (task_id, performer_id) VALUES ($1, $2)',
        [taskId, performerId]
      );
    }

    // Add creator to chat members (but not as a performer)
    const existingCreator = await client.query(
      'SELECT 1 FROM ChatMembers WHERE chat_id = $1 AND user_id = $2',
      [chatId, creator_id]
    );

    if (existingCreator.rows.length === 0) {
      await client.query(
        'INSERT INTO ChatMembers (chat_id, user_id) VALUES ($1, $2)',
        [chatId, creator_id]
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
      task_id: taskId,
      chat_id: chatId 
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
            FROM (
              SELECT performer_id AS user_id FROM Performers WHERE task_id = t.task_id
              UNION
              SELECT task_creater_id AS user_id FROM Tasks WHERE task_id = t.task_id
            ) p
            JOIN "User" u ON p.user_id = u.user_id
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

    // Deactivate task chat
    await client.query(
      'UPDATE Chat SET is_active = false WHERE task_id = $1',
      [taskId]
    );

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

    // Delete associated chats
    await client.query('DELETE FROM Chat WHERE task_id = $1', [taskId]);

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

// Get user's chats
app.get('/api/chats/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const query = `
      SELECT 
        c.*,
        COALESCE(
          (
            SELECT json_build_object(
              'message_text', m.message_text,
              'date', m.date,
              'sender_name', CONCAT(u2.first_name, ' ', u2.last_name)
            )
            FROM Messages m
            LEFT JOIN "User" u2 ON m.sender_id = u2.user_id
            WHERE m.chat_id = c.chat_id
            ORDER BY m.date DESC
            LIMIT 1
          ),
          null
        ) as last_message,
        (
          SELECT COUNT(*)
          FROM Messages m
          WHERE m.chat_id = c.chat_id
          AND m.is_read = false
          AND m.sender_id != $1
        ) as unread_count,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'user_id', u.user_id,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'profile_image', COALESCE(u.profile_image, '')
              )
            )
            FROM ChatMembers cm
            JOIN "User" u ON cm.user_id = u.user_id
            WHERE cm.chat_id = c.chat_id
          ),
          '[]'::json
        ) as participants
      FROM Chat c
      INNER JOIN ChatMembers cm ON c.chat_id = cm.chat_id
      WHERE cm.user_id = $1
      ORDER BY c.last_message_id DESC NULLS LAST`;

    const result = await pool.query(query, [userId]);
    
    res.json({ 
      success: true, 
      chats: result.rows 
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении списка чатов'
    });
  }
});

// Get chat messages
app.get('/api/chats/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  
  try {
    const query = `
      SELECT 
        m.*,
        CONCAT(u.first_name, ' ', u.last_name) as sender_name,
        u.profile_image as sender_image
      FROM Messages m
      JOIN "User" u ON m.sender_id = u.user_id
      WHERE m.chat_id = $1
      ORDER BY m.date DESC
      LIMIT 100`;

    const result = await pool.query(query, [chatId]);
    
    res.json({ 
      success: true, 
      messages: result.rows 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении сообщений'
    });
  }
});

// Send new message
app.post('/api/chats/:chatId/messages', async (req, res) => {
  const { chatId } = req.params;
  const { message_text, sender_id } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert message
    const messageResult = await client.query(
      `INSERT INTO Messages (chat_id, message_text, sender_id)
       VALUES ($1, $2, $3)
       RETURNING message_id`,
      [chatId, message_text, sender_id]
    );

    // Update chat's last_message_id
    await client.query(
      'UPDATE Chat SET last_message_id = $1 WHERE chat_id = $2',
      [messageResult.rows[0].message_id, chatId]
    );

    await client.query('COMMIT');
    
    res.json({ 
      success: true,
      message_id: messageResult.rows[0].message_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отправке сообщения'
    });
  } finally {
    client.release();
  }
});

// Send chat image
app.post('/api/chats/:chatId/images', async (req, res) => {
  const { chatId } = req.params;
  const { image, sender_id } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'chat_images',
      transformation: [
        { quality: 'auto' }
      ]
    });

    // Save image info to database
    const result = await client.query(
      `INSERT INTO MessageImages (chat_id, sender_id, image_url)
       VALUES ($1, $2, $3)
       RETURNING image_id, image_url, created_at`,
      [chatId, sender_id, uploadResponse.secure_url]
    );

    await client.query('COMMIT');
    
    res.json({ 
      success: true,
      image: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending image:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отправке изображения'
    });
  } finally {
    client.release();
  }
});

// Get chat images
app.get('/api/chats/:chatId/images', async (req, res) => {
  const { chatId } = req.params;
  
  try {
    const query = `
      SELECT 
        mi.*,
        CONCAT(u.first_name, ' ', u.last_name) as sender_name,
        u.profile_image as sender_image
      FROM MessageImages mi
      JOIN "User" u ON mi.sender_id = u.user_id
      WHERE mi.chat_id = $1
      ORDER BY mi.created_at DESC`;

    const result = await pool.query(query, [chatId]);
    
    res.json({ 
      success: true, 
      images: result.rows 
    });
  } catch (error) {
    console.error('Error fetching chat images:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении изображений'
    });
  }
});

// Получение информации о чате
app.get('/api/chats/:chatId', async (req, res) => {
  const { chatId } = req.params;
  
  try {
    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN c.task_id IS NOT NULL THEN t.task_title
          ELSE c.chat_name
        END as chat_name,
        CASE 
          WHEN c.task_id IS NOT NULL THEN true
          ELSE c.is_group_chat
        END as is_group_chat,
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
            FROM ChatMembers cm
            JOIN "User" u ON cm.user_id = u.user_id
            WHERE cm.chat_id = c.chat_id
          ),
          '[]'
        ) as participants
      FROM Chat c
      LEFT JOIN Tasks t ON c.task_id = t.task_id
      WHERE c.chat_id = $1`;

    const result = await pool.query(query, [chatId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Чат не найден'
      });
    }
    
    res.json({ 
      success: true, 
      chat: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении информации о чате'
    });
  }
});

app.put('/api/users/:userId/cups-goal', async (req, res) => {
  const { userId } = req.params;
  const { purpose_cup_count } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE "User" SET purpose_cup_count = $1 WHERE user_id = $2 RETURNING *',
      [purpose_cup_count, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update cups goal error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при обновлении цели' 
    });
  }
});

// Create direct chat
app.post('/api/chats/direct', async (req, res) => {
  const { recipient_id, message } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create chat
    const chatResult = await client.query(
      `INSERT INTO Chat (
        chat_name,
        creator_id,
        is_group_chat,
        is_active
      ) VALUES ($1, $2, $3, $4) RETURNING chat_id`,
      ['Direct Chat', recipient_id, false, true]
    );

    const chatId = chatResult.rows[0].chat_id;

    // Add both users to chat members
    await client.query(
      'INSERT INTO ChatMembers (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
      [chatId, recipient_id, req.body.sender_id]
    );

    // Add first message
    const messageResult = await client.query(
      `INSERT INTO Messages (chat_id, message_text, sender_id)
       VALUES ($1, $2, $3)
       RETURNING message_id`,
      [chatId, message, req.body.sender_id]
    );

    // Update chat's last_message_id
    await client.query(
      'UPDATE Chat SET last_message_id = $1 WHERE chat_id = $2',
      [messageResult.rows[0].message_id, chatId]
    );

    await client.query('COMMIT');
    
    res.json({ 
      success: true,
      chat_id: chatId,
      message_id: messageResult.rows[0].message_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating direct chat:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error creating chat' 
    });
  } finally {
    client.release();
  }
});

// Upload organization image
app.put('/api/organizations/:orgId/organization-image', async (req, res) => {
  const { orgId } = req.params;
  const { image } = req.body;
  
  try {
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'organization_images',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Update organization image in database
    const result = await pool.query(
      'UPDATE Organization SET organization_image = $1 WHERE organization_id = $2 RETURNING *',
      [uploadResponse.secure_url, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    res.json({ 
      success: true, 
      organization: result.rows[0],
      organization_image: uploadResponse.secure_url 
    });
  } catch (error) {
    console.error('Update organization image error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при обновлении фото. Пожалуйста, попробуйте ещё раз' 
    });
  }
});

// Получение должностей
app.get('/api/organizations/:orgId/positions', async (req, res) => {
  try {
    const { orgId } = req.params;
    const result = await pool.query(
      'SELECT * FROM Positions WHERE organization_id = $1 ORDER BY post_name',
      [orgId]
    );
    
    res.json({ 
      success: true, 
      positions: result.rows 
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении должностей' 
    });
  }
});

// Создание должности
app.post('/api/organizations/:orgId/positions', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { name } = req.body;
    
    const result = await pool.query(
      'INSERT INTO Positions (post_name, organization_id) VALUES ($1, $2) RETURNING *',
      [name, orgId]
    );
    
    res.json({ 
      success: true, 
      position: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при создании должности' 
    });
  }
});

// Назначение должности пользователю
app.post('/api/users/:userId/position', async (req, res) => {
  try {
    const { userId } = req.params;
    const { positionId } = req.body;
    
    // Обновляем с дополнительным JOIN для получения названия должности
    const result = await pool.query(
      `UPDATE "User" u
       SET post_id = $1
       FROM Positions p
       WHERE u.user_id = $2
       AND p.post_id = $1
       RETURNING u.*, p.post_name`,
      [positionId, userId]
    );
    
    res.json({ 
      success: true, 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error assigning position:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при назначении должности' 
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
