# Risk Assessment Database Schema

## Table: `spaceprl_risk`

This table stores risk assessment lottery choice data from participants in the SpaceTask experiment.

### Column Structure

| Column Name | Data Type | Description | Example Value |
|-------------|-----------|-------------|---------------|
| `expName` | VARCHAR(100) | Experiment name identifier | "FullPilot12_2" |
| `prolificID` | VARCHAR(50) | Unique participant identifier from Prolific | "random-ABC12" or actual Prolific ID |
| `timestamp` | TIMESTAMP | When the data was submitted | "2024-01-15 14:30:22" |
| `choice_0` | INT | Choice for lottery pair 1 (0=A, 1=B) | 0 |
| `choice_1` | INT | Choice for lottery pair 2 (0=A, 1=B) | 1 |
| `choice_2` | INT | Choice for lottery pair 3 (0=A, 1=B) | 0 |
| `choice_3` | INT | Choice for lottery pair 4 (0=A, 1=B) | 0 |
| `choice_4` | INT | Choice for lottery pair 5 (0=A, 1=B) | 1 |
| `choice_5` | INT | Choice for lottery pair 6 (0=A, 1=B) | 0 |
| `choice_6` | INT | Choice for lottery pair 7 (0=A, 1=B) | 1 |
| `choice_7` | INT | Choice for lottery pair 8 (0=A, 1=B) | 0 |
| `choice_8` | INT | Choice for lottery pair 9 (0=A, 1=B) | 1 |
| `choice_9` | INT | Choice for lottery pair 10 (0=A, 1=B) | 0 |
| `selected` | INT | Randomly selected lottery pair for payment (0-9) | 7 |
| `amount` | DECIMAL(5,2) | Actual payoff amount in pounds | 1.46 |

### Lottery Pairs Reference

The risk assessment uses the Holt and Laury (2002) lottery pairs:

| Lottery # | Prob High | Option A (High/Low) | Option B (High/Low) |
|-----------|-----------|---------------------|---------------------|
| 1 | 1/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 2 | 2/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 3 | 3/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 4 | 4/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 5 | 5/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 6 | 6/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 7 | 7/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 8 | 8/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 9 | 9/10 | £1.46 / £1.17 | £2.81 / £0.07 |
| 10 | 10/10 | £1.46 / £1.17 | £2.81 / £0.07 |

### Sample JSON Data Structure

The JavaScript frontend sends data in this format:
```json
{
  "expName": "FullPilot12_2",
  "prolificID": "random-ABC12",
  "risk_assessment": {
    "choice_0": 0,
    "choice_1": 1,
    "choice_2": 0,
    "choice_3": 0,
    "choice_4": 1,
    "choice_5": 0,
    "choice_6": 1,
    "choice_7": 0,
    "choice_8": 1,
    "choice_9": 0
  },
  "selected": 7,
  "amount": 1.46
}
```

### SQL Table Creation

```sql
CREATE TABLE spaceprl_risk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expName VARCHAR(100),
    prolificID VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    choice_0 INT,
    choice_1 INT,
    choice_2 INT,
    choice_3 INT,
    choice_4 INT,
    choice_5 INT,
    choice_6 INT,
    choice_7 INT,
    choice_8 INT,
    choice_9 INT,
    selected INT,
    amount DECIMAL(5,2),
    INDEX idx_prolific (prolificID),
    INDEX idx_timestamp (timestamp)
);
```

### Risk Preference Analysis

- **Risk Averse**: Participants who choose Option A (coded as 0) for more lottery pairs (safer option)
- **Risk Seeking**: Participants who choose Option B (coded as 1) for more lottery pairs (riskier option)
- **Switch Point**: The lottery number where participant switches from 0 to 1 indicates risk preference level
- **Inconsistent**: Multiple switches between 0 and 1 may indicate inconsistent preferences or confusion

### Coding Scheme

- **0**: Option A (safer lottery with lower variance)
- **1**: Option B (riskier lottery with higher variance)

### Compensation Algorithm

The system implements the incentive-compatible payment mechanism described in the task:

1. **Random Lottery Selection**: One of the 10 lottery pairs (0-9) is randomly selected using `Math.floor(Math.random() * 10)`
2. **Choice Retrieval**: The participant's choice for the selected lottery is retrieved (0=A, 1=B)
3. **Payoff Determination**: Based on the lottery probabilities, a random draw determines if the participant receives the high or low payoff
4. **Amount Calculation**: The final payment amount is calculated based on their choice and the random outcome

**Example**: If lottery 7 is selected (probHigh = 7/10) and participant chose Option B:
- 70% chance of receiving £2.81 (high payoff)
- 30% chance of receiving £0.07 (low payoff)

The `selected` field stores which lottery was chosen for payment, and `amount` stores the actual payoff amount.

## Table: `spaceprl_risk_trial`

This table stores individual trial data from the sequential risk assessment task where each lottery is played immediately without feedback.

### Column Structure

| Column Name | Data Type | Description | Example Value |
|-------------|-----------|-------------|---------------|
| `prolificID` | VARCHAR(50) | Unique participant identifier | "random-ABC12" |
| `expName` | VARCHAR(100) | Experiment name identifier | "FullPilot12_2" |
| `trial` | INT | Trial number (1-10) | 7 |
| `probHigh` | INT | Probability of high outcome (1-10) | 7 |
| `optionA_high` | DECIMAL(5,2) | Option A high payoff | 1.46 |
| `optionA_low` | DECIMAL(5,2) | Option A low payoff | 1.17 |
| `optionB_high` | DECIMAL(5,2) | Option B high payoff | 2.81 |
| `optionB_low` | DECIMAL(5,2) | Option B low payoff | 0.07 |
| `choice` | INT | Participant's choice (0=A, 1=B) | 1 |
| `outcome` | VARCHAR(10) | Actual outcome ('high' or 'low') | "high" |
| `amount` | DECIMAL(5,2) | Actual payoff amount | 2.81 |
| `randomDraw` | DECIMAL(10,8) | Random number for outcome (0-1) | 0.12345678 |
| `totalScore` | DECIMAL(8,2) | Cumulative score after this trial | 15.47 |
| `timestamp` | VARCHAR(50) | ISO timestamp when trial completed | "2024-01-15T14:30:22.123Z" |

### SQL Table Creation

```sql
CREATE TABLE spaceprl_risk_trial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prolificID VARCHAR(50),
    expName VARCHAR(100),
    trial INT,
    probHigh INT,
    optionA_high DECIMAL(5,2),
    optionA_low DECIMAL(5,2),
    optionB_high DECIMAL(5,2),
    optionB_low DECIMAL(5,2),
    choice INT,
    outcome VARCHAR(10),
    amount DECIMAL(5,2),
    randomDraw DECIMAL(10,8),
    totalScore DECIMAL(8,2),
    timestamp VARCHAR(50),
    db_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prolific_trial (prolificID, trial),
    INDEX idx_timestamp (db_timestamp)
);
```

### Trial Data Flow

1. **Sequential Presentation**: Each lottery pair is presented individually
2. **Immediate Execution**: Choice is made and lottery is played immediately
3. **No Feedback**: Participant doesn't see outcome, but it's recorded
4. **Score Accumulation**: Each trial outcome adds to total score
5. **Database Recording**: Each trial is immediately sent to database

This approach provides detailed trial-by-trial data for analyzing decision patterns and allows for real-time score accumulation without revealing outcomes to participants. 