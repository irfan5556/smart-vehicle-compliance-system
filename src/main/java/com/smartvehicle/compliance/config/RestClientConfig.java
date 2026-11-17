package com.smartvehicle.compliance.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Value("${rapidapi.rto.connect-timeout-seconds:10}")
    private int connectTimeoutSeconds;

    @Value("${rapidapi.rto.read-timeout-seconds:15}")
    private int readTimeoutSeconds;

    @Bean
    public RestClient rtoRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(connectTimeoutSeconds));
        factory.setReadTimeout(Duration.ofSeconds(readTimeoutSeconds));

        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }
}

