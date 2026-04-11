import { motion, useMotionValue, useTransform } from "motion/react"

import { animate } from "motion"
import { useEffect } from "react"

export function AnimatedNumber({
  value,
  format = (v: number) => v.toFixed(0),
}: {
  value: number
  format?: (v: number) => string
}) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => format(v))

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: "easeOut",
    })

    return controls.stop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <motion.span>{display}</motion.span>
}
