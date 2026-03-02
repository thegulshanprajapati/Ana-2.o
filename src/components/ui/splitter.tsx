
"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import { ImperativePanelGroupHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { cn } from "@/lib/utils"

const SplitterContext = React.createContext<{
  id: string
  direction: "horizontal" | "vertical"
} | null>(null)

function useSplitterContext() {
  const context = React.useContext(SplitterContext)
  if (!context) {
    throw new Error("useSplitterContext must be used within a Splitter")
  }
  return context
}

type SplitterProps = Omit<React.ComponentProps<typeof PanelGroup>, "direction"> & {
  direction?: "horizontal" | "vertical"
}

const Splitter = React.forwardRef<ImperativePanelGroupHandle, SplitterProps>(
  (
    { className, direction = "horizontal", children, ...props },
    ref
  ) => {
    const id = React.useId()

    return (
      <SplitterContext.Provider value={{ id, direction }}>
        <PanelGroup
          ref={ref}
          direction={direction}
          className={cn("flex size-full data-[panel-group-direction=vertical]:flex-col", className)}
          {...props}
        >
          {children}
        </PanelGroup>
      </SplitterContext.Provider>
    )
  }
)
Splitter.displayName = "Splitter"

type SplitterPanelProps = React.ComponentProps<typeof Panel>

const SplitterPanel = React.forwardRef<React.ElementRef<typeof Panel>, SplitterPanelProps>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Panel
        ref={ref}
        className={cn(
          "transition-transform",
          className
        )}
        {...props}
      />
    )
  }
)
SplitterPanel.displayName = "SplitterPanel"

const SplitterHandle = ({ className, ...props }: React.ComponentProps<typeof PanelResizeHandle>) => {
  useSplitterContext()

  return (
    <PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      {...props}
    >
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    </PanelResizeHandle>
  )
}
SplitterHandle.displayName = "SplitterHandle"


const SplitterComposition = ({ children, ...props }: SplitterProps) => {
  const kids = React.Children.toArray(children)
  return (
    <Splitter {...props}>
      {kids.map((child, i) => (
        <React.Fragment key={i}>
          {child}
          {i < kids.length - 1 && <SplitterHandle />}
        </React.Fragment>
      ))}
    </Splitter>
  )
}

export { Splitter, SplitterPanel, SplitterHandle }
