<?php

class ClientIpResolver {
    public static function resolve() {
        $trustProxy = function_exists('env')
            && filter_var(env('TRUST_PROXY', 'false'), FILTER_VALIDATE_BOOLEAN);
        $forwardedFor = $trustProxy ? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '') : '';
        if ($forwardedFor !== '') {
            $parts = explode(',', $forwardedFor);
            foreach ($parts as $part) {
                $candidate = trim($part);
                if (filter_var($candidate, FILTER_VALIDATE_IP)) {
                    return $candidate;
                }
            }
        }

        $clientIp = $trustProxy ? ($_SERVER['HTTP_CLIENT_IP'] ?? '') : '';
        if (!empty($clientIp) && filter_var($clientIp, FILTER_VALIDATE_IP)) {
            return $clientIp;
        }

        $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
        if (!empty($remoteAddr) && filter_var($remoteAddr, FILTER_VALIDATE_IP)) {
            return $remoteAddr;
        }

        return '127.0.0.1';
    }
}
