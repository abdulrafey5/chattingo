# ---------- Stage 1: builder (maven)
FROM maven:3.9.6-eclipse-temurin-17 as build
WORKDIR /workspace
COPY pom.xml .
# cache maven deps
RUN mvn -B -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

# ---------- Stage 2: extract artifact (optional slim)
FROM eclipse-temurin:17-jdk-alpine as runtime-base
WORKDIR /app
COPY --from=build /workspace/target/*.jar ./app.jar
# if you have application.properties, copy here or mount at runtime

# ---------- Stage 3: final runtime (JRE)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=runtime-base /app/app.jar /app/app.jar
EXPOSE 3000
ENV JAVA_OPTS="-Xms256m -Xmx512m"
CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

