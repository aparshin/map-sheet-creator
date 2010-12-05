SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';


-- -----------------------------------------------------
-- Table `request`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `request` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `minx` INT NOT NULL ,
  `maxx` INT NOT NULL ,
  `miny` INT NOT NULL ,
  `maxy` INT NOT NULL ,
  `zoom` INT NOT NULL ,
  `sizex` DOUBLE NOT NULL ,
  `sizey` DOUBLE NOT NULL ,
  `ne_lon` DOUBLE NOT NULL ,
  `ne_lat` DOUBLE NOT NULL ,
  `nw_lon` DOUBLE NOT NULL ,
  `nw_lat` DOUBLE NOT NULL ,
  `se_lon` DOUBLE NOT NULL ,
  `se_lat` DOUBLE NOT NULL ,
  `sw_lon` DOUBLE NOT NULL ,
  `sw_lat` DOUBLE NOT NULL ,
  `status` INT NOT NULL ,
  PRIMARY KEY (`id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `request_layers`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `request_layers` (
  `idrequest` INT NOT NULL ,
  `order` INT NOT NULL ,
  `mapname` VARCHAR(45) NOT NULL ,
  PRIMARY KEY (`idrequest`, `order`) ,
  UNIQUE INDEX `idrequest_UNIQUE` (`idrequest` ASC) ,
  INDEX `fk_request` (`idrequest` ASC) ,
  CONSTRAINT `fk_request`
    FOREIGN KEY (`idrequest` )
    REFERENCES `request` (`id` )
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `metadata`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `metadata` (
  `version` INT NOT NULL ,
  PRIMARY KEY (`version`) )
ENGINE = InnoDB;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `metadata`
-- -----------------------------------------------------
SET AUTOCOMMIT=0;
INSERT INTO metadata (`version`) VALUES ('1');

COMMIT;
