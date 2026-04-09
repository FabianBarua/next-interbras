"use client";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import React from "react";;

export function CTA() {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-3 my-10 md:my-20 justify-start relative z-20 max-w-7xl mx-auto bg-gradient-to-br from-gray-100 to-white dark:from-neutral-900 dark:to-neutral-950">
      <GridLineHorizontal className="top-0" offset="200px" />
      <GridLineHorizontal className="bottom-0 top-auto" offset="200px" />
      <GridLineVertical className="left-0" offset="80px" />
      <GridLineVertical className="left-auto right-0" offset="80px" />
      <div className="md:col-span-2 p-8 md:p-14">
        <h2 className="text-left text-neutral-500 dark:text-neutral-200 text-xl md:text-3xl tracking-tight font-medium">
          Supercharge QA with{" "}
          <span className="font-bold text-black dark:text-white">
            AI-driven testing
          </span>
        </h2>
        <p className="text-left text-neutral-500 mt-4 max-w-lg dark:text-neutral-200 text-xl md:text-3xl tracking-tight font-medium">
          Empower your <span className="text-sky-700">entire team</span> to
          create and run tests in{" "}
          <span className="text-sky-700">plain English</span>.
        </p>

        <div className="flex items-start sm:items-center flex-col sm:flex-row sm:gap-4">
          <a
            href="#contact"
            className="mt-8 flex space-x-2 items-center group text-base px-4 py-2 rounded-lg bg-black text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]"
          >
            <span>Join the waitlist</span>
            <ArrowRight className="text-white group-hover:translate-x-1 stroke-[1px] h-3 w-3 mt-0.5 transition-transform duration-200" />
          </a>
        </div>
      </div>
      <div className="border-t md:border-t-0 md:border-l border-dashed p-8 md:p-14">
        <p className="text-base text-neutral-700 dark:text-neutral-200">
          &quot;Chaotic has transformed our QA process. Our product owners now
          write and run tests effortlessly, catching issues before they reach
          production. It&apos;s a game-changer for our team.&quot;
        </p>
        <div className="flex flex-col text-sm items-start mt-4 gap-1">
          <p className="font-bold text-neutral-800 dark:text-neutral-200">
            Sarah Johnson
          </p>
          <p className="text-neutral-500 dark:text-neutral-400">
            Product Owner, TechInnovate Inc.
          </p>
        </div>
      </div>
    </section>
  );
}

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute w-[calc(100%+var(--offset))] h-[var(--height)] left-[calc(var(--offset)/2*-1)]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute h-[calc(100%+var(--offset))] w-[var(--width)] top-[calc(var(--offset)/2*-1)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};