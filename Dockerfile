# ==============================================================================
# Stage 1: Build the Spring Boot application using Maven
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal, secure JRE runtime image
# ==============================================================================
FROM eclipse-temurin:17-jre-alpine

# Add metadata
LABEL maintainer="Smart Vehicle Compliance System Team"
LABEL description="Spring Boot 3 Smart Vehicle Compliance API Service"

WORKDIR /app

# Run as a dedicated non-root security user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled jar from builder
COPY --from=builder /build/target/*.jar app.jar

# Adjust ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose backend Tomcat port
EXPOSE 8080

# Configure JVM for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENV SPRING_PROFILES_ACTIVE="prod"

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/v3/api-docs || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

