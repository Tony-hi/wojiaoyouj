export const validateRequired = (value: string | number | null | undefined, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
    return `${fieldName}不能为空`
  }
  return null
}

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value.length < minLength) {
    return `${fieldName}不能少于${minLength}个字符`
  }
  return null
}

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value.length > maxLength) {
    return `${fieldName}不能超过${maxLength}个字符`
  }
  return null
}

export const validateMinValue = (value: number, min: number, fieldName: string): string | null => {
  if (value < min) {
    return `${fieldName}不能小于${min}`
  }
  return null
}

export const validateMaxValue = (value: number, max: number, fieldName: string): string | null => {
  if (value > max) {
    return `${fieldName}不能大于${max}`
  }
  return null
}

export const validatePhone = (value: string): string | null => {
  if (!/^1[3-9]\d{9}$/.test(value)) {
    return '请输入正确的手机号码'
  }
  return null
}

export const validateAmount = (value: string): string | null => {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return '请输入正确的金额格式'
  }
  return null
}

export const validateDate = (value: string): string | null => {
  const date = new Date(value)
  if (!(date instanceof Date && !isNaN(date.getTime()))) {
    return '请输入正确的日期格式'
  }
  return null
}

export const validateExpireDate = (productionDate: string, expireDate: string): string | null => {
  const prod = new Date(productionDate)
  const expire = new Date(expireDate)
  if (expire <= prod) {
    return '保质期不能早于生产日期'
  }
  return null
}

export const validatePassword = (value: string): string | null => {
  if (value.length < 6) {
    return '密码至少需要6位'
  }
  return null
}

export const validateProductUnique = (name: string, spec: string, products: any[], excludeId?: string): string | null => {
  const exists = products.some(p => 
    p.id !== excludeId && 
    p.name === name && 
    p.spec === spec
  )
  if (exists) {
    return '相同名称和规格的商品已存在'
  }
  return null
}

export const validateCategoryUnique = (name: string, categories: any[], excludeId?: string): string | null => {
  const exists = categories.some(c => 
    c.id !== excludeId && 
    c.name === name
  )
  if (exists) {
    return '该分类名称已存在'
  }
  return null
}

export const validateStockEnough = (productId: string, quantity: number, stocks: any[]): string | null => {
  const available = stocks
    .filter(s => s.product_id === productId)
    .reduce((sum, s) => sum + s.quantity, 0)
  if (available < quantity) {
    return `库存不足，当前库存${available}件`
  }
  return null
}
