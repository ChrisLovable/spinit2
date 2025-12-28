-- Simplified MySQL Database Schema

-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    photo LONGTEXT,
    description TEXT NOT NULL,
    prize_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ticket_price DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    spin_date DATE NOT NULL,
    spin_time TIME NOT NULL,
    spin_datetime DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    winning_number INT,
    winner_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User entries table
CREATE TABLE IF NOT EXISTS user_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT NOT NULL,
    entry_number INT NOT NULL CHECK (entry_number >= 1 AND entry_number <= 20),
    player_name VARCHAR(255) NOT NULL,
    payment_transaction_id VARCHAR(255),
    payment_amount DECIMAL(10, 2),
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id),
    INDEX idx_entry_number (entry_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Spin results table
CREATE TABLE IF NOT EXISTS spin_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT NOT NULL,
    winning_number INT NOT NULL CHECK (winning_number >= 1 AND winning_number <= 20),
    spin_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Winners table
CREATE TABLE IF NOT EXISTS winners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT NOT NULL,
    spin_result_id INT NOT NULL,
    user_entry_id INT NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    winning_number INT NOT NULL CHECK (winning_number >= 1 AND winning_number <= 20),
    won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (spin_result_id) REFERENCES spin_results(id) ON DELETE CASCADE,
    FOREIGN KEY (user_entry_id) REFERENCES user_entries(id) ON DELETE CASCADE,
    INDEX idx_competition (competition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
