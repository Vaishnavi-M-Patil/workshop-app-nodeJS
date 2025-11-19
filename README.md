# workshop-app-nodeJS

### To build `Dockerfile`:
```
 docker build -t node-app .
```
### to run docker container:
```
docker run -d -p 3000:3000 --name node-app-container node-app:latest
```
### Run docker compose file:
```
docker compose up -d
```
### Take container access:
```
docker exec -it <cont_name> bash
```
### Database commands to create table and add data into it:
```
 USE music_database; 
```
```
CREATE TABLE songs ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, artist VARCHAR(255) NOT NULL, url VARCHAR(255) NOT NULL, date_created DATETIME DEFAULT CURRENT_TIMESTAMP ); 
```
```
INSERT INTO songs (name, artist, url) VALUES('Sample Song', 'Unknown Artist', 'sample-song.mp3'),('Sample Song 1', 'Unknown Artist', 'sample-song1.mp3'),('Sample Song 2', 'Unknown Artist', 'sample-song2.mp3'),('Sample Song 3', 'Unknown Artist', 'sample-song3.mp3'),('Sample Song 4', 'Unknown Artist', 'sample-song4.mp3'),('Sample Song 5', 'Unknown Artist', 'sample-song5.mp3'),('Sample Song 6', 'Unknown Artist', 'sample-song6.mp3'),('Sample Song 7', 'Unknown Artist', 'sample-song7.mp3'),('Sample Song 8', 'Unknown Artist', 'sample-song8.mp3');
```
