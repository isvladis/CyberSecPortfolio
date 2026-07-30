"use client";

import { motion } from "framer-motion";
import { Code2, ExternalLink, Shield } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ProjectProps {
  title: string;
  desc: string;
  tech: string[];
  status: "Secure" | "Deploying";
  repoUrl?: string;
  demoUrl?: string;
}

const ProjectLink = ({ href, icon, children }: { href?: string; icon: React.ReactNode; children: React.ReactNode }) => {
  if (!href) {
    return <Badge variant="private">PRIVATE_LAB</Badge>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-normal text-accent transition-colors hover:text-white"
    >
      {icon}
      {children}
    </a>
  );
};

export const ProjectCard = ({ title, desc, tech, status, repoUrl, demoUrl }: ProjectProps) => {
  return (
    <motion.article
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="group relative z-0 flex h-full flex-col justify-between rounded-lg border border-accent/20 bg-black/80 p-7 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:z-10 hover:border-accent hover:shadow-[0_15px_50px_-15px_var(--color-accent)]"
    >
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-md bg-accent/10 p-2 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-black">
            <Shield size={18} />
          </div>
          <Badge variant={status === "Secure" ? "default" : "warning"} className="tracking-[0.18em]">
            {status.toUpperCase()}
          </Badge>
        </div>

        <h3 className="mb-3 font-mono text-lg font-bold uppercase tracking-wide text-white transition-colors group-hover:text-accent">
          {title}
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-gray-300">{desc}</p>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {tech.map((item) => (
            <Badge key={item} variant="neutral" className="transition-colors group-hover:border-accent/30">
              {item}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-auto flex justify-between gap-3 border-t border-white/10 pt-4">
        <ProjectLink href={repoUrl} icon={<Code2 size={12} />}>
          SOURCE_CODE
        </ProjectLink>
        <ProjectLink href={demoUrl} icon={<ExternalLink size={12} />}>
          LIVE_DEMO
        </ProjectLink>
      </div>
    </motion.article>
  );
};
