package com.example.parkingsystem.security;

import com.example.parkingsystem.security.UserDetailsImpl;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders; // Keeping it if I decide to revert, actually wait, the tool asked to fix lints.
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${edith.app.jwtSecret}")
    private String jwtSecret;

    @Value("${edith.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    public String generateJwtToken(Authentication authentication) {

        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject((userPrincipal.getUsername()))
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // If secret is literal string not base64 encoded, we might need to change how
    // we create key.
    // For this example I'll assume the properties file has a long string and I'll
    // use it directly to bytes if needed or verify.
    // Actually safe way for HS512:
    // If jwtSecret is just a string, we can do
    // Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    // But above expects base64. Let's stick to standard practice: secret in
    // properties should be long enough.
    // I previously set "edithSecretKey..." which is not Base64. I should change
    // key() to use simple bytes or encode it.
    // Let's change key() to use getBytes() for simplicity unless I provided a
    // base64 string.
    // I'll adjust key() below to be safe for plain string.

    /*
     * private Key key() {
     * return Keys.hmacShaKeyFor(jwtSecret.getBytes());
     * }
     */

    // Actually, let's just make sure the secret is treated as bytes.
    // The previous implementation assumes Base64. I will change it to
    // straightforward bytes to avoid decoding errors if user didn't base64 encode
    // it.

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }
}
