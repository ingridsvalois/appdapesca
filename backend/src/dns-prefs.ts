/**
 * DEVE ser o primeiro import do backend.
 * Força Node a preferir IPv4 — Railway não suporta IPv6.
 */
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
