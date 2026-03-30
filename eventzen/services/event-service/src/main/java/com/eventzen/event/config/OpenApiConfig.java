package com.eventzen.event.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "swagger.enabled", havingValue = "true")
public class OpenApiConfig {

    @Bean
    public OpenAPI eventServiceOpenAPI() {
        SecurityScheme bearerScheme = new SecurityScheme()
                .name("Authorization")
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT");

        return new OpenAPI()
                .info(new Info()
                        .title("EventZen Event Service API")
                        .version("1.0.0")
                        .description("Event management, categories, sessions, agenda and search APIs."))
                .components(new Components().addSecuritySchemes("BearerAuth", bearerScheme))
                .addSecurityItem(new SecurityRequirement().addList("BearerAuth"));
    }
}
