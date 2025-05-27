-- 1. Сначала создаем extension для хэширования паролей
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Создаем базовые таблицы без внешних ключей
CREATE TABLE Organization (
    organization_id SERIAL PRIMARY KEY,
    organization_name VARCHAR(255),
    description VARCHAR(255),
    organization_image VARCHAR(255),
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(255),
    website VARCHAR(255),
    timezone VARCHAR(50),
    chat_id INT
);

CREATE TABLE Positions (
    post_id SERIAL PRIMARY KEY,
    post_name VARCHAR(255),
    organization_id INT
);

CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    patronymic VARCHAR(255),
    post_id INT,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    profile_image VARCHAR(255),
    organization_id INT,
    full_cup_count INT DEFAULT 0,
    now_cup_count INT DEFAULT 0,
    purpose_cup_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'banned')),
    role VARCHAR(50) CHECK (role IN ('Admin', 'Manager', 'User')),
    timezone VARCHAR(50),
    language VARCHAR(10)
);

-- 3. Создаем остальные таблицы
CREATE TABLE Tasks (
    task_id SERIAL PRIMARY KEY,
    organization_id INT,
    task_title VARCHAR(255),
    task_description VARCHAR(255),
    image_id VARCHAR(255), -- JSON или массив URL изображений
    start_date TIMESTAMP,
    finish_date TIMESTAMP,
    task_creater_id INT,
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(50) CHECK (status IN ('open', 'in_progress', 'completed')), -- исправлено здесь
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE Chat (
    chat_id SERIAL PRIMARY KEY,
    chat_name VARCHAR(255),
    chat_image VARCHAR(255),
    task_id INT NULL,  -- task_id может быть NULL, если чат не привязан к задаче
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creator_id INT,
    is_group_chat BOOLEAN DEFAULT FALSE,
    last_message_id INT,
    is_active BOOLEAN DEFAULT true -- Добавлено поле is_active
);

CREATE TABLE Messages (
    chat_id INT,
    message_id SERIAL PRIMARY KEY,
    message_text VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sender_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    reply_to_message_id INT
);

CREATE TABLE Friendships (
    friendship_id SERIAL PRIMARY KEY,
    user_id INT,
    friend_id INT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Subtasks (
    subtask_id SERIAL PRIMARY KEY,
    task_id INT,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Performers (
    performers_table_id SERIAL PRIMARY KEY,
    performer_id INT,
    task_id INT
);

ALTER TABLE Tasks
ADD COLUMN reward_points INT DEFAULT 0;

CREATE TABLE TaskImages (
    image_id SERIAL PRIMARY KEY,
    task_id INT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для комментариев к задачам
CREATE TABLE TaskComments (
    comment_id SERIAL PRIMARY KEY,
    task_id INT,
    user_id INT,
    comment_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "User"(user_id)
);

-- Таблица для уведомлений
CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT,
    notification_type VARCHAR(50),
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_id INT, -- ID связанной сущности (задачи, сообщения и т.д.)
    FOREIGN KEY (user_id) REFERENCES "User"(user_id)
);

-- Таблица для истории изменений задач
CREATE TABLE TaskHistory (
    history_id SERIAL PRIMARY KEY,
    task_id INT,
    user_id INT,
    change_type VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "User"(user_id)
);

-- Таблица для заявок в организацию
CREATE TABLE OrganizationRequests (
    request_id SERIAL PRIMARY KEY,
    user_id INT,
    organization_id INT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "User"(user_id),
    FOREIGN KEY (organization_id) REFERENCES Organization(organization_id)
);

-- 4. Добавляем внешние ключи через ALTER TABLE
ALTER TABLE Positions
ADD CONSTRAINT FK_Positions_Organization
FOREIGN KEY (organization_id) REFERENCES Organization(organization_id);

ALTER TABLE "User"
ADD CONSTRAINT FK_User_Position
FOREIGN KEY (post_id) REFERENCES Positions(post_id);

ALTER TABLE "User"
ADD CONSTRAINT FK_User_Organization
FOREIGN KEY (organization_id) REFERENCES Organization(organization_id);

ALTER TABLE Friendships
ADD CONSTRAINT FK_Friendships_User
FOREIGN KEY (user_id) REFERENCES "User"(user_id) ON DELETE CASCADE;

ALTER TABLE Friendships
ADD CONSTRAINT FK_Friendships_Friend
FOREIGN KEY (friend_id) REFERENCES "User"(user_id) ON DELETE CASCADE;

ALTER TABLE Tasks
ADD CONSTRAINT FK_Tasks_Organization
FOREIGN KEY (organization_id) REFERENCES Organization(organization_id);

ALTER TABLE Tasks
ADD CONSTRAINT FK_Tasks_User
FOREIGN KEY (task_creater_id) REFERENCES "User"(user_id);

ALTER TABLE Chat
ADD CONSTRAINT FK_Chat_Task
FOREIGN KEY (task_id) REFERENCES Tasks(task_id);

ALTER TABLE Chat
ADD CONSTRAINT FK_Chat_User
FOREIGN KEY (creator_id) REFERENCES "User"(user_id);

ALTER TABLE Messages
ADD CONSTRAINT FK_Messages_Chat
FOREIGN KEY (chat_id) REFERENCES Chat(chat_id);

ALTER TABLE Messages
ADD CONSTRAINT FK_Messages_User
FOREIGN KEY (sender_id) REFERENCES "User"(user_id);

ALTER TABLE Messages
ADD CONSTRAINT FK_Messages_Reply
FOREIGN KEY (reply_to_message_id) REFERENCES Messages(message_id);

ALTER TABLE Subtasks
ADD CONSTRAINT FK_Subtasks_Tasks
FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE;

ALTER TABLE Performers
ADD CONSTRAINT FK_Performers_User
FOREIGN KEY (performer_id) REFERENCES "User"(user_id);

ALTER TABLE Performers
ADD CONSTRAINT FK_Performers_Tasks
FOREIGN KEY (task_id) REFERENCES Tasks(task_id);

-- Добавление внешнего ключа в таблицу "Organization" для admin_id
ALTER TABLE Organization
ADD CONSTRAINT FK_Organization_User
FOREIGN KEY (admin_id) REFERENCES "User"(user_id);

-- Добавление внешнего ключа в таблицу "Organization" для chat_id
ALTER TABLE Organization
ADD CONSTRAINT FK_Organization_Chat
FOREIGN KEY (chat_id) REFERENCES Chat(chat_id);

-- Добавление внешнего ключа в таблицу "Chat" для last_message_id
ALTER TABLE Chat
ADD CONSTRAINT FK_Chat_LastMessage
FOREIGN KEY (last_message_id) REFERENCES Messages(message_id);

-- 5. Создаем функции и триггеры
-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for email validation
CREATE TRIGGER validate_email_trigger
BEFORE INSERT OR UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION validate_email();

-- Function for user registration
CREATE OR REPLACE FUNCTION register_user(
    p_email VARCHAR,
    p_password VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_patronymic VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM "User" WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email already registered';
    END IF;

    -- Insert new user
    INSERT INTO "User" (
        email,
        password,
        first_name,
        last_name,
        patronymic,
        status,
        role
    ) VALUES (
        p_email,
        crypt(p_password, gen_salt('bf')),
        p_first_name,
        p_last_name,
        p_patronymic,
        'active',
        'User'
    ) RETURNING user_id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function for user authentication
CREATE OR REPLACE FUNCTION authenticate_user(
    p_email VARCHAR,
    p_password VARCHAR
) RETURNS TABLE (
    user_id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.role
    FROM "User" u
    WHERE u.email = p_email 
    AND u.password = crypt(p_password, u.password)
    AND u.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_login = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_login_trigger
BEFORE UPDATE ON "User"
FOR EACH ROW
WHEN (OLD.last_login IS DISTINCT FROM NEW.last_login)
EXECUTE FUNCTION update_last_login();

-- Функция поиска пользователей
CREATE OR REPLACE FUNCTION search_users(search_query TEXT)
RETURNS TABLE (
    user_id INT,
    first_name VARCHAR,
    last_name VARCHAR,
    patronymic VARCHAR,
    profile_image VARCHAR,
    post_id INT,
    organization_id INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.patronymic,
        u.profile_image,
        u.post_id,
        u.organization_id
    FROM "User" u
    WHERE 
        u.status = 'active' AND
        (
            LOWER(u.first_name) LIKE LOWER('%' || search_query || '%') OR
            LOWER(u.last_name) LIKE LOWER('%' || search_query || '%') OR
            LOWER(u.patronymic) LIKE LOWER('%' || search_query || '%') OR
            LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER('%' || search_query || '%') OR
            LOWER(CONCAT(u.last_name, ' ', u.first_name)) LIKE LOWER('%' || search_query || '%')
        )
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Функция поиска организаций
CREATE OR REPLACE FUNCTION search_organizations(search_query TEXT)
RETURNS TABLE (
    organization_id INT,
    organization_name VARCHAR,
    description VARCHAR,
    organization_image VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.organization_id,
        o.organization_name,
        o.description,
        o.organization_image
    FROM Organization o
    WHERE 
        LOWER(o.organization_name) LIKE LOWER('%' || search_query || '%') OR
        LOWER(o.description) LIKE LOWER('%' || search_query || '%')
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to validate task dates and create history record
CREATE OR REPLACE FUNCTION validate_task_dates_and_track()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate dates
    IF NEW.start_date >= NEW.finish_date THEN
        RAISE EXCEPTION 'Start date must be before finish date';
    END IF;

    -- Track changes for existing tasks
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO TaskHistory (
            task_id,
            user_id,
            change_type,
            old_value,
            new_value
        ) VALUES (
            NEW.task_id,
            NEW.task_creater_id,
            'task_update',
            row_to_json(OLD)::text,
            row_to_json(NEW)::text
        );
    END IF;

    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for task validation and tracking
CREATE TRIGGER task_validation_and_tracking
BEFORE INSERT OR UPDATE ON Tasks
FOR EACH ROW
EXECUTE FUNCTION validate_task_dates_and_track();

-- Function to create a new task with subtasks and performers
CREATE OR REPLACE FUNCTION create_task(
    p_organization_id INT,
    p_title VARCHAR,
    p_description VARCHAR,
    p_start_date TIMESTAMP,
    p_finish_date TIMESTAMP,
    p_creator_id INT,
    p_priority VARCHAR,
    p_reward_points INT,
    p_performers INT[],
    p_subtasks jsonb[] -- Array of objects with title and description
) RETURNS INT AS $$
DECLARE
    v_task_id INT;
    v_performer INT;
    v_subtask jsonb;
BEGIN
    -- Create main task
    INSERT INTO Tasks (
        organization_id,
        task_title,
        task_description,
        start_date,
        finish_date,
        task_creater_id,
        priority,
        status,
        reward_points
    ) VALUES (
        p_organization_id,
        p_title,
        p_description,
        p_start_date,
        p_finish_date,
        p_creator_id,
        p_priority,
        'open',
        p_reward_points
    ) RETURNING task_id INTO v_task_id;

    -- Add performers
    FOREACH v_performer IN ARRAY p_performers LOOP
        INSERT INTO Performers (performer_id, task_id)
        VALUES (v_performer, v_task_id);
    END LOOP;

    -- Add subtasks
    FOREACH v_subtask IN ARRAY p_subtasks LOOP
        INSERT INTO Subtasks (task_id, title, description)
        VALUES (
            v_task_id,
            v_subtask->>'title',
            v_subtask->>'description'
        );
    END LOOP;

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- Добавление таблицы участников чата
CREATE TABLE ChatMembers (
    member_id SERIAL PRIMARY KEY,
    chat_id INT,
    user_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES Chat(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "User"(user_id) ON DELETE CASCADE
);

-- Создание уникального ограничения, чтобы предотвратить дубликаты участников
ALTER TABLE ChatMembers
ADD CONSTRAINT unique_chat_member UNIQUE (chat_id, user_id);

-- Таблица для изображений в сообщениях
CREATE TABLE MessageImages (
    image_id SERIAL PRIMARY KEY,
    chat_id INT,
    sender_id INT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES Chat(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES "User"(user_id)
);
