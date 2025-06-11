# SKIPPY

See More. Wait less.

Nobody likes waiting in line, especially when you're travelling and time is of essence. SKIPPY is our solution to a smarter way to plan trips and avoid waiting in long lines. 

Our solution is a web app that allows tourists to view the expected waiting times at partnering attraction sites. In this prototype, we have implemented a mock site for Paris. 

Through our solution, we aim to provide accurate wait time estimates so that tourists can plan their itinerary ahead and anticipate crowds ahead of time.

## Working principle
A beam-break sensor will be installed at the entrance of participating attraction sites. This will be used to measure the rate of visitor flow.

An ultrasonic sensor will be placed in the queue to estimate the number of people waiting in line. This can also be adapted to snaking queues.

With the rate of visitor flow and estimated visitors waiting in line, SKIPPY can estimate the waiting time should a visitor join the line.

## Prototype
Our prototype is built with the following

### Frontend
- HTML
- CSS
- Javascript

### Backend
- PostgreSQL
- Express JS

### Hardware
- ESP32 (Computing and networking module)
- Buttons (To simulate the beam-break sensor)
- HC-SR04 Ultrasonic sensor 

## Contributors

| Name          | GitHub       |
|--------------|---------------|
| Siah Yee Long      | @siahyeelong       |
| Szander Brenner     | @SzanderB      |
| Kabir Gupta   | @kabirbg    |
| Tochukwu Okonwko | @BSZTHEBEST99  |
| Joseph Downs  | @Jtime2   |

### TODO list
[x] implement the refresh
[x] add buy tickets inside each dialog
[x] highlight colour of wait time chart
[x] make the interface mobile friendly
[x] add geographical location of each attraction and put inside dialog
[x] add a map view to see all attractions in map view